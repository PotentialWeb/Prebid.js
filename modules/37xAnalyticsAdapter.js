import { ajax } from 'src/ajax';
import AnalyticsAdapter from 'src/AnalyticsAdapter';
import CONSTANTS from 'src/constants.json';
import adaptermanager from 'src/adaptermanager';
import * as utils from 'src/utils';

const analyticsType = 'endpoint';
const url = '//collector.37x.com';
// const errorUrl = `${url}/error`;

const requestDebounce = 200;
const requiredOptions = ['organizationId', 'siteId'];

CONSTANTS.EVENTS.ADSERVER_RENDER = 'adserverRender';
CONSTANTS.SESSION_STORAGE = {
  PREFIX: '37x-analytics',
  KEY: 'session',
  TIMEOUT: 60 * 60 * 1000
};
CONSTANTS.AUCTION_EVENT_STATUS = {
  RENDERED: 'rendered',
  UNRENDERED: 'unrendered',
  PREBID_RENDERED: 'prebidRendered'
};

export { CONSTANTS };

/**
 * @func ThirtySevenXAdapter
 * @desc Wrapper class which creates a new instance of the 37x Analytics Adapter
 * @class
 * @constructor
 */

export default class ThirtySevenXAdapter {
  constructor() {
    let adapter = Object.assign(AnalyticsAdapter({ url, analyticsType }), {

      /**
       * @prop auctionEvents
       * @desc Holds all events triggered by auctions
       * @type { array }
       */

      auctionEvents: [],

      /**
       * @func track
       * @desc Overrides the default analytics adapter track function
       * @param { object } event Destructure eventType {string} && args {object}
       */

      track({ eventType, args }) {
        try {
          switch (eventType) {
            case CONSTANTS.EVENTS.AUCTION_END:
              this.onAuctionEnd(args);
              break;

            case CONSTANTS.EVENTS.ADSERVER_RENDER:
              utils.logMessage(`Emitting event for: ${CONSTANTS.EVENTS.ADSERVER_RENDER}`);
              this.onAdserverRender(args.adserver, args);
              break;

            case CONSTANTS.EVENTS.BID_WON:
              this.onBidWon(args);
              break;
          }
        } catch (err) {
          utils.logWarn(err.message);
        }
      },

      /**
       * @func onAuctionEnd
       * @desc Fired when auction has ended and highest CPM bids have been calculated
       */

      onAuctionEnd(args, revenue = 0) {
        try {
          let highestCpmBids = global.pbjs.getHighestCpmBids();

          if (!highestCpmBids || !highestCpmBids.length > 0) {
            throw Error(`No pbjs.highestCpmBids returned for auctionId '${args.auctionId}'`);
          }

          this.auctionEvents = [
            ...this.auctionEvents,
            ...highestCpmBids.map(bid => {
              bid.revenue = bid.cpm / 1000;
              revenue += bid.revenue;
              return {
                revenue: bid.revenue,
                auctionId: bid.auctionId,
                adUnitCode: bid.adUnitCode,
                status: CONSTANTS.AUCTION_EVENT_STATUS.UNRENDERED
              };
            }),
          ];

          this.creditSessionRevenue(this.session, revenue);
        } catch (err) {
          utils.logWarn(err.message);
        }
      },

      /**
       * @func onAdserverRender
       * @desc Fired when an adserver render is emitted
       */

      onAdserverRender(adserver, args) {
        try {
          let adUnitCode = this.getAdUnitCodeFromAdserverResponse(...arguments);
          if (adUnitCode) {
            if (!this.getAdUnit(adUnitCode)) {
              utils.logInfo(`Adserver '${adserver}' rendered adUnit '${adUnitCode}' which was not configured via Prebid.js`);
              return;
            }
            let auctionEvent = this.getAuctionEventByAdUnitCode(adUnitCode);
            if (auctionEvent) {
              this.setAuctionEventStatus(auctionEvent, CONSTANTS.AUCTION_EVENT_STATUS.RENDERED);
            } else {
              utils.logInfo(`Adserver '${adserver}' rendered adUnit '${adUnitCode}' directly without a winning Prebid bid.`);
            }
          } else {
            utils.logInfo(`Could not get adUnitCode from adserver '${adserver}' render event response.`);
          }
          this.incrementSessionImpressions(this.session);
          this.willSendData();
        } catch (err) {
          utils.logInfo(err.message);
        }
      },

      /**
       * @func onBidWon
       * @desc Fired when a Prebid bid has won an auction slot.
       * NOTE: This is triggered AFTER onAdserverRender is called.
       */

      onBidWon(args) {
        try {
          let auctionEvent = this.getAuctionEventByAdUnitCode(args.adUnitCode);
          if (!auctionEvent) {
            throw Error(`Could not find auctionEvent for adUnitCode '${adUnitCode}'. It should exist.`);
          }
          this.setAuctionEventStatus(auctionEvent, CONSTANTS.AUCTION_EVENT_STATUS.PREBID_RENDERED);
          this.incrementSessionPrebidImpressions(this.session);
          this.creditSessionRevenue(this.session, auctionEvent.revenue, 'prebidRevenue');
          this.willSendData();
        } catch (err) {
          utils.logInfo(err.message);
        }
      },

      /**
       * @func setupSession
       * @desc Sets up the session, either retrieving or creating a new
       * object within sessionStorage
       */

      setupSession() {
        return this.restoreSession() || this.createSession();
      },

      /**
       * @func restoreSession
       * @desc Sets up the session, either retrieving or creating a new
       * object within sessionStorage
       * @return { object } session
       */

      restoreSession() {
        let session = getSessionStorageObject(this.sessionKey);
        if (!session || this.isSessionExpired(session)) { return; }
        utils.logInfo(`Retrieving 37x Analytics Session with sessionId '${session.sessionId}'`);
        return session;
      },

      /**
       * @func createSession
       * @desc Creates a new session
       * @return { object } session
       */

      createSession() {
        let session = {
          organizationId: this.config.organizationId,
          siteId: this.config.siteId,
          sessionId: utils.generateUUID(),
          revenue: 0,
          prebidRevenue: 0,
          adserverRevenueRatio: 0,
          impressions: 0,
          prebidImpressions: 0,
          adserverImpressionRatio: 0,
          pageviews: 1,
          key: null
        };

        session.landingPath = this.getCurrentPath();
        session.currentPath = this.getCurrentPath();
        session.device = this.getDevice();
        session.source = this.getSource();

        utils.logInfo(`Creating new 37x Analytics Session with sessionId '${session.sessionId}'`);

        this.refreshSessionExpiry(session);

        setSessionStorageObject(this.sessionKey, session);

        return session;
      },

      /**
       * @func getCurrentPath
       * @desc Gets the current path
       * @return { string } landingPath
       */

      getCurrentPath() {
        return window.location.pathname;
      },

      /**
       * @func getDevice
       * @desc Gets the device type. Will return one of 'desktop', 'tablet',
       * 'mobile' or 'other'.
       * @param { string } ua - can pass a useragent string to the function. If
       * not present, will use window.navigator.userAgent
       * @param { string } type - can pass a default type, which will be used if
       * useragent is not matched by any tests. Defaults to 'desktop'.
       * @return { string } deviceType
       */

      getDevice(ua, type = 'desktop') {
        ua = ua || ((window && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : null);

        if (!utils.isStr(ua)) {
          utils.logWarn(`'window.navigator.userAgent' is not present. Not capturing device type.`);
          return;
        }

        Object.keys(deviceTests).some(deviceType => {
          return deviceTests[deviceType].some(testStr => {
            let matches = testStr.test(ua);
            if (matches) {
              type = deviceType;
            }
            return matches;
          });
        });

        if (type === 'tv' || type === 'console' || type === 'wearable') {
          type = 'other';
        }

        return type;
      },

      /**
       * @func getSource
       * @desc Gets the source of the session from either ?utm_source
       * query parameter or document.referrer
       * @return { string } source
       */

      getSource(url, referrer) {
        let source = getQueryParam(url, 'utm_source');
        if (utils.isStr(source)) { return source; }
        referrer = utils.isStr(referrer) ? referrer : document.referrer;
        source = getURLSegment(referrer, 'host');
        source = source.split(':')[0]; // Double check port is stripped
        source = source.replace('www.', ''); // Double check www. is stripped
        return source.length > 0 ? source : 'organic';
      },

      /**
       * @func creditSessionRevenue
       * @desc Adds value to session revenue
       */

      creditSessionRevenue(session, value, type = 'revenue') {
        session[type] += value;
      },

      /**
       * @func incrementSessionImpressions
       * @desc Increments session impressions value
       */

      incrementSessionImpressions(session) {
        session.impressions += 1;
      },

      /**
       * @func incrementSessionPrebidImpressions
       * @desc Increments session prebid impressions value
       */

      incrementSessionPrebidImpressions(session) {
        session.prebidImpressions += 1;
      },

      /**
       * @func incrementSessionPageviews
       * @desc If path doesn't match lastPath, increment pageview
       */

      incrementSessionPageviews(session) {
        let currentPath = this.getCurrentPath();
        if (session.currentPath === currentPath) { return; }
        session.currentPath = currentPath;
        session.pageviews += 1;
      },

      /**
       * @func calculateAdserverImpressionRatio
       * @desc Calculates adserver render ratio
       */

      calculateAdserverImpressionRatio(session) {
        let { impressions, prebidImpressions } = session;

        // 0/0 === NaN. Handle that edge case.
        if (!utils.isNumber(impressions) ||
            !utils.isNumber(prebidImpressions) ||
            (impressions === 0 && prebidImpressions === 0)) {
          return;
        }

        session.adserverImpressionRatio = 1 - (prebidImpressions / impressions);
      },

      /**
       * @func calculateAdserverRevenueRatio
       * @desc Calculates adserver revenue ratio
       */

      calculateAdserverRevenueRatio(session) {
        let { revenue, prebidRevenue } = session;

        // 0/0 === NaN. Handle that edge case.
        if (!utils.isNumber(revenue) ||
            !utils.isNumber(prebidRevenue) ||
            (revenue === 0 && prebidRevenue === 0)) {
          return;
        }

        session.adserverRevenueRatio = 1 - (prebidRevenue / revenue);
      },

      /**
       * @func refreshSessionExpiry
       * @desc Refreshes the session expiry
       */

      refreshSessionExpiry(session) {
        session.exp = new Date().getTime() + CONSTANTS.SESSION_STORAGE.TIMEOUT;
      },

      /**
       * @func isSessionExpired
       * @desc Determines whether the session is expired
       * @return { boolean }
       */

      isSessionExpired({ exp }) {
        if (!utils.isNumber(exp)) { return true; }
        if (utils.isStr(exp)) { exp = parseInt(exp); }
        return new Date().getTime() > exp;
      },

      /**
       * @func isConfigValid
       * @desc Checks requiredOptions have been passed to the adapter
       * @return { boolean }
       */

      isConfigValid() {
        return requiredOptions.filter(key => {
          if (typeof this.config[key] !== 'string') {
            utils.logError(`37x Analytics Adapter requires '${key}' (string) to be present`);
            return false;
          }
          return true;
        }).length > 0;
      },

      /**
       * @func getAdUnit
       * @desc Gets adUnit from Prebid global registry
       * @param { String } adUnitCode
       */

      getAdUnit(adUnitCode) {
        return global.pbjs.adUnits.find(adUnit => adUnit.code === adUnitCode);
      },

      /**
       * @func getAdUnitCodeFromAdserverResponse
       * @desc Gets adUnitCode from adserver render event response
       */

      getAdUnitCodeFromAdserverResponse(adserver, args) {
        switch (adserver) {
          case 'dfp':
            return args && args.slot && typeof args.slot.getAdUnitPath === 'function' ? args.slot.getAdUnitPath() : undefined;
        }
      },

      /**
       * @func getAuctionEventByAdUnitCode
       * @desc Gets auctionEvent from adUnitCode
       */

      getAuctionEventByAdUnitCode(adUnitCode) {
        return this.auctionEvents.find(e => {
          return adUnitCode === e.adUnitCode;
        });
      },

      /**
       * @func setAuctionEventStatus
       * @desc Sets a new event status on an auctionEvent
       */

      setAuctionEventStatus(auctionEvent, status) {
        auctionEvent.status = status;
      },

      /**
       * @func attachAdserverRenderListeners
       * @desc Attaches adserver render listeners based upon the
       * adserver config passed to 37x Analytics adapter
       */

      attachAdserverRenderListeners(adservers = ['dfp']) {
        adservers = this.config.adservers || adservers;

        adservers.forEach(adserver => {
          switch (adserver) {
            case 'dfp':
              global.googletag = global.googletag || {}
              global.googletag.cmd = global.googletag.cmd || []
              global.googletag.cmd.push(() => {
                global.googletag.pubads().addEventListener('slotRenderEnded', args => {
                  args.adserver = adserver;
                  this.enqueue({ eventType: CONSTANTS.EVENTS.ADSERVER_RENDER, args })
                });
              });
              break;
            default:
              utils.logWarn(`Could not attach adserver render listeners for unsupported adserver '${adserver}'`);
              break;
          }
        });
      },

      /**
       * @func willSendData
       * @desc Takes a request to send data from a sibling function and debounces
       * the actual sending of data.
       */

      willSendData() {
        if (this.debouncer) { clearTimeout(this.debouncer); }
        this.debouncer = setTimeout(this.sendData.bind(this), requestDebounce)
      },

      /**
       * @func sendData
       * @desc Handles the sending of data to the 37x collector microservice
       */

      sendData() {
        let session = this.session;
        // Calculate the adserver impression ratio
        this.calculateAdserverImpressionRatio(session);
        // Calculate the adserver revenue ratio
        this.calculateAdserverRevenueRatio(session);
        // Increment pageview
        this.incrementSessionPageviews(session);
        // Save the session data to sessionStorage
        setSessionStorageObject(this.sessionKey, session);
        // Send data to collector
        this.makeRequest(session);
      },

      /**
       * @func makeRequest
       * @desc Makes a POST request to the 37x collector microservice
       */

      makeRequest(session) {
        try {
          if (this.config.environment === 'test') {
            this.canSendData = true;
            utils.logInfo(`37x Analytics Adapter session analytics successfully sent (in test mode).`, this.session);
            return;
          }
          ajax(url, res => this.afterRequest(res), JSON.stringify(session), { contentType: 'application/json' });
        } catch (err) {
          utils.logWarn(`POST request to 37x collector service errored. Analytics data not sent to server.`);
        }
      },

      /**
       * @func afterRequest
       * @desc Handles response from POST request to 37x collector microservice
       */

      afterRequest(res) {
        try {
          if (!res || !res.length) {
            throw Error(`POST request to 37x collector service responded with an empty response. Unsure if data was sent correctly.`);
          }
          res = JSON.parse(res);

          if (res.key && this.session.key !== res.key) {
            this.session.key = res.key;
            setSessionStorageObject(this.sessionKey, this.session);
          }

          utils.logInfo(`37x Analytics Adapter session analytics successfully sent.`, this.session);
        } catch (err) {
          utils.logWarn(err.message);
        }
      }
    });

    /** save the base class function */
    adapter.originEnableAnalytics = adapter.enableAnalytics;

    /**
     * @func enableAnalytics
     * @desc Overrides enableAnalytics so we can get access to the
     * config passed in from the page.
     * @param { object } config user's analytics adapter configuration
     */

    adapter.enableAnalytics = function(config) {
      try {
        this.config = config.options;

        if (!this.isConfigValid()) {
          utils.logError('37x Analytics Adapter could not be enabled with config', this.config);
          this.errored = true;
          return false;
        }

        this.attachAdserverRenderListeners();

        this.sessionKey = `${CONSTANTS.SESSION_STORAGE.PREFIX}-${CONSTANTS.SESSION_STORAGE.KEY}`;
        this.session = this.setupSession();

        utils.logInfo('37x Analytics Adapter enabled with config', this.config);

        adapter.originEnableAnalytics(...arguments); // call the base class function
      } catch (err) {
        utils.logWarn(err.message);
      }
    };

    // Return the adapter from the constructor
    return adapter;
  }
}

/**
 * @func getSessionStorageObject
 * @desc Gets an item from sessionStorage and parses it from json
 * @return { object|undefined }
 */

export function getSessionStorageObject(key) {
  let obj = sessionStorage.getItem(key);
  try {
    return JSON.parse(obj);
  } catch (err) {
    utils.logWarn(`JSON.parse() on 37x Analytics Adapter session object failed.`);
    return undefined;
  }
}

/**
 * @func setSessionStorageObject
 * @desc Sets a session storage object after
 */

export function setSessionStorageObject(key, obj) {
  if (typeof obj !== 'object' || typeof key !== 'string') {
    return;
  }
  sessionStorage.setItem(key, JSON.stringify(obj));
}

/**
 * @func getQueryParam
 * @desc Gets a query param from the current URL
 * @return { string } query param value
 */

function getQueryParam(url, key) {
  key = key.replace(/[\[\]]/g, '\\$&');
  let regex = new RegExp(`[?&]${key}(=([^&#]*)|&|#|$)`);
  let results = regex.exec(url || window.location.href);
  if (!results) { return null };
  if (!results[2]) { return '' };
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * @func getURLSegment
 * @desc Gets a given segment of a url
 * @return { string } url segment
 */

function getURLSegment(url, key) {
  if (!utils.isStr(url) || url === '') { return ''; }
  let l = document.createElement('a');
  l.href = url;
  return l[key];
}

/**
 * @prop deviceTests
 * @desc An exhaustive list of regex matchers for device types to
 * 'best-guess' the device type used for the impression. The final
 * output will match 'desktop', 'tablet', 'mobile', 'other'.
 */

const deviceTests = {
  tablet: [
    /\((ipad|playbook);[\w\s\);-]+(rim|apple)/i, // iPad/PlayBook
    /applecoremedia\/[\w\.]+ \((ipad)/, // iPad
    /(archos)\s(gamepad2?)/i, // Archos
    /(hp).+(touchpad)/i, // HP TouchPad
    /(hp).+(tablet)/i, // HP Tablet
    /(kindle)\/([\w\.]+)/i, // Kindle
    /\s(nook)[\w\s]+build\/(\w+)/i, // Nook
    /(dell)\s(strea[kpr\s\d]*[\dko])/i, // Dell Streak
    /(kf[A-z]+)\sbuild\/[\w\.]+.*silk\//i, // Kindle Fire HD
    /android.+(transfo[prime\s]{4,10}\s\w+|eeepc|slider\s\w+|nexus 7|padfone)/i, // Asus Tablets
    /(sony)\s(tablet\s[ps])\sbuild\//i, // Sony
    /(sony)?(?:sgp.+)\sbuild\//i, // Sony
    /(lenovo)\s?(S(?:5000|6000)+(?:[-][\w+]))/i, // Lenovo tablets
    /(nexus\s9)/i, // HTC Nexus 9
    /android.+\s(mz60\d|xoom[\s2]{0,2})\sbuild\//i,
    /android.+((sch-i[89]0\d|shw-m380s|gt-p\d{4}|gt-n\d+|sgh-t8[56]9|nexus 10))/i, // Samsung tablets
    /((SM-T\w+))/i,
    /android\s3\.[\s\w;-]{10}(a\d{3})/i, // Acer
    /android.+([vl]k\-?\d{3})\s+build/i, // LG Tablet
    /android\s3\.[\s\w;-]{10}(lg?)-([06cv9]{3,4})/i, // LG Tablet
    /android.+(ideatab[a-z0-9\-\s]+)/i, // Lenovo
    /android.+;\s(pixel c)\s/i, // Google Pixel C
    /android.+(mi[\s\-_]*(?:pad)(?:[\s_]*[\w\s]+)?)\s+build/i, // Mi Pad tablets
    /android.+;\s(m[1-5]\snote)\sbuild/i, // Meizu Tablet
    /android.+[;\/]\s*(RCT[\d\w]+)\s+build/i, // RCA Tablets
    /android.+[;\/]\s*(Venue[\d\s]*)\s+build/i, // Dell Venue Tablets
    /android.+[;\/]\s*(Q[T|M][\d\w]+)\s+build/i, // Verizon Tablet
    /android.+[;\/]\s+(Barnes[&\s]+Noble\s+|BN[RT])(V?.*)\s+build/i, // Barnes & Noble Tablet
    /android.+[;\/]\s+(TM\d{3}.*\b)\s+build/i, // Barnes & Noble Tablet
    /android.+[;\/]\s*(zte)?.+(k\d{2})\s+build/i, // ZTE K Series Tablet
    /android.+[;\/]\s*(zur\d{3})\s+build/i, // Swiss ZUR Tablet
    /android.+[;\/]\s*((Zeki)?TB.*\b)\s+build/i, // Zeki Tablets
    /(android).+[;\/]\s+([YR]\d{2}x?.*)\s+build/i, // Dragon Touch Tablet
    /android.+[;\/]\s+(Dragon[\-\s]+Touch\s+|DT)(.+)\s+build/i, // Dragon Touch Tablet
    /android.+[;\/]\s*(NS-?.+)\s+build/i, // Insignia Tablets
    /android.+[;\/]\s*((NX|Next)-?.+)\s+build/i, // NextBook Tablets
    /android.+[;\/]\s*(V(100MD|700NA|7011|917G).*\b)\s+build/i, // Envizen Tablets
    /android.+[;\/]\s*(Le[\s\-]+Pan)[\s\-]+(.*\b)\s+build/i, // Le Pan Tablets
    /android.+[;\/]\s*(Trio[\s\-]*.*)\s+build/i,
    /android.+[;\/]\s*(Trinity)[\-\s]*(T\d{3})\s+build/i, // Trinity Tablets
    /android.+[;\/]\s*TU_(1491)\s+build/i, // Rotor Tablets
    /android.+(KS(.+))\s+build/i, // Amazon Kindle Tablets
    /android.+(Gigaset)[\s\-]+(Q.+)\s+build/i, // Gigaset Tablets

    // Unidentifiable Tablet
    /\s(tablet|tab)[;\/]/i
  ],
  mobile: [
    /(sd|kf)[0349hijorstuw]+\sbuild\/[\w\.]+.*silk\//i, // Fire Phone
    /\((ip[honed|\s\w*]+);.+(apple)/i, // iPod/iPhone
    /\((ip[honed|\s\w*]+);/i, // iPod/iPhone
    /(blackberry)[\s-]?(\w+)/i, // BlackBerry
    /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[\s_-]?([\w-]+)*/i,
    // BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Meizu/Motorola/Polytron
    /(hp)\s([\w\s]+\w)/i, // HP iPAQ
    /(asus)-?(\w+)/i, // Asus
    /\(bb10;\s(\w+)/i, // BlackBerry 10
    /android.+\s([c-g]\d{4}|so[-l]\w+)\sbuild\//i, // Sony
    /(sprint\s(\w+))/i, // Sprint Phones
    /(htc)[;_\s-]+([\w\s]+(?=\))|\w+)*/i, // HTC
    /(zte)-(\w+)*/i, // ZTE
    /(alcatel|geeksphone|lenovo|nexian|panasonic|(?=;\s)sony)[_\s-]?([\w-]+)*/i,
    // Alcatel/GeeksPhone/Lenovo/Nexian/Panasonic/Sony
    /d\/huawei([\w\s-]+)[;\)]/i,
    /(nexus\s6p)/i, // Huawei
    /(microsoft);\s(lumia[\s\w]+)/i, // Microsoft Lumia
    /(kin\.[onetw]{3})/i, // Microsoft Kin
    /\s(milestone|droid(?:[2-4x]|\s(?:bionic|x2|pro|razr))?(:?\s4g)?)[\w\s]+build\//i, // Motorola
    /mot[\s-]?(\w+)*/i, // Motorola
    /(XT\d{3,4}) build\//i, // Motorola
    /(nexus\s6)/i, // Motorola
    /((s[cgp]h-\w+|gt-\w+|galaxy\snexus|sm-\w[\w\d]+))/i, // Samsung
    /(sam[sung]*)[\s-]*(\w+-?[\w-]*)*/i,
    /sec-((sgh\w+))/i,
    /sie-(\w+)*/i, // Siemens Mobile
    /(maemo|nokia).*(n900|lumia\s\d+)/i, // Nokia
    /(nokia)[\s_-]?([\w-]+)*/i,
    /(nexus\s[45])/i, // LG
    /lg[e;\s\/-]+(\w+)*/i,
    /android.+lg(\-?[\d\w]+)\s+build/i,
    /linux;.+((jolla));/i, // Jolla
    /android.+;\s(oppo)\s?([\w\s]+)\sbuild/i, // OPPO
    /android.+;\s(pixel xl|pixel)\s/i, // Google Pixel
    /android.+(\w+)\s+build\/hm\1/i, // Xiaomi Hongmi 'numeric' models
    /android.+(hm[\s\-_]*note?[\s_]*(?:\d\w)?)\s+build/i, // Xiaomi Hongmi
    /android.+(mi[\s\-_]*(?:one|one[\s_]plus|note lte)?[\s_]*(?:\d\w?)?[\s_]*(?:plus)?)\s+build/i, // Xiaomi Mi
    /android.+(redmi[\s\-_]*(?:note)?(?:[\s_]*[\w\s]+)?)\s+build/i, // Redmi Phones
    /android.+a000(1)\s+build/i, // OnePlus
    /android.+oneplus\s(a\d{4})\s+build/i,
    /android.+[;\/]\s*(gen\d{3})\s+build.*49h/i, // Swiss GEN Mobile
    /android.+[;\/]\s*(Xtreme\_?)?(V(1[045]|2[015]|30|40|60|7[05]|90))\s+build/i,
    /android.+[;\/]\s*(LVTEL\-?)?(V1[12])\s+build/i, // LvTel Phones

    // Unidentifiable Mobile
    /\s(mobile)(?:[;\/]|\ssafari)/i
  ],
  tv: [
    /(apple\s{0,1}tv)/i, // Apple TV
    /hbbtv\/\d+\.\d+\.\d+\s+\([\w\s]*;\s*(\w[^;]*);([^;]*)/i, // HbbTV devices
    /hbbtv.+maple;(\d+)/i, // Samsung TV
    /\(dtv[\);].+(aquos)/i, // Sharp TV
    /smart-tv.+(samsung)/i, // Samsung TV
    /(lg) netcast\.tv/i, // LG SmartTV
    /crkey/i // Google Chromecast
  ],
  console: [
    /\s(ouya)\s/i, // Ouya
    /(nintendo)\s([wids3u]+)/i, // Nintendo
    /android.+;\s(shield)\sbuild/i, // Nvidia
    /(playstation\s[34portablevi]+)/i, // Playstation
    /[\s\(;](xbox(?:\sone)?)[\s\);]/i // Microsoft Xbox
  ],
  wearable: [
    /((pebble))app\/[\d\.]+\s/i, // Pebble
    /android.+;\s(glass)\s\d/i // Google Glass
  ],
  desktop: [
    /(mac\sos\sx)\s?([\w\s\.]+\w)*/i, // Mac OS
    /(macintosh|mac(?=_powerpc)\s)/i, // Mac OS
    /microsoft\s(windows)\s(vista|xp)/i, // Windows
    /(windows)\snt\s6\.2;\s(arm)/i // Windows NT
  ],
};

/** register the analytics adapter with the adapter manager */

adaptermanager.registerAnalyticsAdapter({
  adapter: new ThirtySevenXAdapter(),
  code: '37x'
});
