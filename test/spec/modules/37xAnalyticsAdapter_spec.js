import { assert, expect } from 'chai';
import adaptermanager from 'src/adaptermanager';
import * as events from 'src/events';

import {
  default as ThirtySevenXAdapter,
  getSessionStorageObject,
  setSessionStorageObject,
  CONSTANTS
} from 'modules/37xAnalyticsAdapter';

CONSTANTS.SESSION_KEY = `${CONSTANTS.SESSION_STORAGE.PREFIX}-${CONSTANTS.SESSION_STORAGE.KEY}`;
CONSTANTS.MOCK_UID = 'xxxxxxxxxxx';

describe('37xAnalyticsAdapter', () => {
  let adapter;

  before(() => {
    // Stub global services for all tests
    stubGoogletag();
    stubPbjs();
  });

  beforeEach(() => {
    // Create a new adapter instance for each test
    adapter = newAdapterInstance();
  });

  afterEach(() => {
    // Tear down event listeners for each used adapter instance
    adapter.disableAnalytics();
  });

  describe('configuration', () => {
    it('should error if no organizationId or siteId passed as options', () => {
      enableAdapterInstance({ /* Leaving options blank */ });
      expect(adapter.errored).to.eq(true);
    });

    it('should extend valid options into adapter config', () => {
      enableAdapterInstance();
      expect(adapter.config).to.have.property('organizationId', CONSTANTS.MOCK_UID);
      expect(adapter.config).to.have.property('siteId', CONSTANTS.MOCK_UID);
    });
  });

  describe('sessions', () => {
    it('can create a new session', () => {
      enableAdapterInstance();

      let testEqual = {
        organizationId: CONSTANTS.MOCK_UID,
        siteId: CONSTANTS.MOCK_UID,
        revenue: 0,
        prebidRevenue: 0,
        adserverRevenueRatio: 0,
        impressions: 0,
        prebidImpressions: 0,
        adserverImpressionRatio: 0,
        pageviews: 1
      };

      Object.keys(testEqual).forEach(key => {
        expect(adapter.session).to.have.property(key, testEqual[key]);
      });

      let testType = {
        sessionId: 'string',
        landingPath: 'string',
        currentPath: 'string',
        device: 'string',
        source: 'string',
        exp: 'number'
      };

      Object.keys(testType).forEach(key => {
        expect(adapter.session[key]).to.be.a(testType[key]);
      });
    });

    it('can restore an existing session', () => {
      const testSession = stubSession();

      setSessionStorageObject(CONSTANTS.SESSION_KEY, testSession);

      enableAdapterInstance();

      expect(adapter.sessionKey).to.equal(CONSTANTS.SESSION_KEY);
      expect(adapter.session).to.deep.equal(testSession);

      setSessionStorageObject(CONSTANTS.SESSION_KEY, null);
    });

    it('cannot restore an expired session', () => {
      const testSession = stubSession({
        exp: new Date().getTime() - 1
      });

      setSessionStorageObject(CONSTANTS.SESSION_KEY, testSession);

      enableAdapterInstance();

      expect(adapter.session.pageviews).to.not.deep.equal(testSession);
      expect(adapter.session.pageviews).to.equal(1);

      setSessionStorageObject(CONSTANTS.SESSION_KEY, null);
    });
  });

  describe('functions', () => {
    beforeEach(() => {
      enableAdapterInstance();
    });

    it('should parse source from utm_source query param', () => {
      let source = adapter.getSource(`http://test.com?utm_source=awesome-referrer.com`);
      expect(source).to.equal('awesome-referrer.com');
    });

    it('should parse source from document.referrer', () => {
      let source = adapter.getSource(`http://test.com`, `http://awesome-referrer.com`);
      expect(source).to.equal('awesome-referrer.com');
    });

    it('should return source as organic when no referrer specified', () => {
      let source = adapter.getSource(`http://test.com`, '');
      expect(source).to.equal('organic');
    });

    it('should get correct device type from useragent string', () => {
      const ua = {
        desktop: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36`,
        mobile: `Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25`,
        tablet: `Mozilla/5.0 (iPad; CPU OS 9_3_2 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13F69 Safari/601.1`,
        other: 'Mozilla/5.0 (PlayStation 4 1.70) AppleWebKit/536.26 (KHTML, like Gecko)'
      };

      Object.keys(ua).forEach(deviceType => {
        let device = adapter.getDevice(ua[deviceType]);
        expect(device).to.equal(deviceType);
      });
    });
  });

  describe('events', () => {
    it('should handle AUCTION_END event', () => {
      stubPbjs({
        highestCpmBids: [{
          cpm: 0.1, auctionId: '1', adUnitCode: '1'
        }]
      });

      enableAdapterInstance();

      adapter.track({
        eventType: CONSTANTS.EVENTS.AUCTION_END, args: {}
      });

      expect(adapter.auctionEvents).to.have.lengthOf(1);
      expect(adapter.auctionEvents[0]).to.have.property('adUnitCode', '1');
      expect(adapter.auctionEvents[0]).to.have.property('auctionId', '1');
      expect(adapter.auctionEvents[0]).to.have.property('revenue', 0.0001);
      expect(adapter.auctionEvents[0]).to.have.property('status', 'unrendered');

      expect(adapter.session.revenue).to.equal(0.0001);
    });

    it('builds and sends session data from events', (done) => {
      stubPbjs({
        highestCpmBids: [{
          cpm: 0.1, auctionId: '1', adUnitCode: '1'
        }, {
          cpm: 0.1, auctionId: '1', adUnitCode: '2'
        }],
        adUnits: [{
          code: '1'
        }, {
          code: '2'
        }]
      });

      enableAdapterInstance();

      adapter.track({
        eventType: CONSTANTS.EVENTS.AUCTION_END, args: {}
      });

      expect(adapter.auctionEvents).to.have.lengthOf(2);
      expect(adapter.session.revenue).to.equal(0.0002);

      adapter.track({
        eventType: CONSTANTS.EVENTS.ADSERVER_RENDER,
        args: {
          adserver: 'dfp',
          slot: {
            getAdUnitPath() { return '1'; }
          }
        }
      });

      adapter.track({
        eventType: CONSTANTS.EVENTS.ADSERVER_RENDER,
        args: {
          adserver: 'dfp',
          slot: {
            getAdUnitPath() { return '2'; }
          }
        }
      });

      expect(adapter.auctionEvents[0]).to.have.property('status', 'rendered');
      expect(adapter.auctionEvents[1]).to.have.property('status', 'rendered');
      expect(adapter.session.impressions).to.equal(2);

      adapter.track({
        eventType: CONSTANTS.EVENTS.BID_WON,
        args: {
          adUnitCode: '1'
        }
      });

      expect(adapter.auctionEvents[0]).to.have.property('status', 'prebidRendered');
      expect(adapter.auctionEvents[1]).to.have.property('status', 'rendered');
      expect(adapter.session.prebidRevenue).to.equal(0.0001);

      setTimeout(() => {
        expect(adapter.session.adserverRevenueRatio).to.equal(0.5);
        expect(adapter.canSendData).to.equal(true);

        let storedSession = getSessionStorageObject(CONSTANTS.SESSION_KEY);

        let testValues = {
          revenue: 0.0002,
          prebidRevenue: 0.0001,
          adserverRevenueRatio: 0.5,
          impressions: 2,
          prebidImpressions: 1,
          adserverImpressionRatio: 0.5,
          pageviews: 1
        };

        Object.keys(testValues).forEach(key => {
          expect(storedSession).to.have.property(key, testValues[key]);
        });

        done();
      }, 500);
    });
  });
});

/**
 * @func newAdapterInstance
 * @desc Creates a new instance of the adapter and registers with the
 * Prebid.js adaptermanager
 * @return { Object } Adapter object
**/

function newAdapterInstance() {
  let adapter = new ThirtySevenXAdapter();

  adaptermanager.registerAnalyticsAdapter({
    code: `37x`,
    adapter
  });

  return adapter;
}

/**
 * @func enableAdapterInstance
 * @desc Enables the current 37x adapter instance
 * @param { Object } - Custom options to be used in adapter config
**/

function enableAdapterInstance(opts) {
  let options = opts || {
    organizationId: CONSTANTS.MOCK_UID,
    siteId: CONSTANTS.MOCK_UID,
    environment: 'test'
  };

  adaptermanager.enableAnalytics({
    provider: `37x`,
    options
  });
}

/**
 * @func stubGoogletag
 * @desc Stubs global `googletag` property
**/

function stubGoogletag() {
  window.googletag = {
    _slots: [],
    cmd: [],
    pubads() {
      let self = this;
      return {
        getSlots() { return self._slots; },
        setSlots(slots) { self._slots = slots; }
      };
    }
  };
}

/**
 * @func stubPbjs
 * @desc Stubs global Prebid.js reference
 * @param { Object } - stub configuration
**/

function stubPbjs(opts = {}) {
  let highestCpmBids = opts.highestCpmBids || [];

  window.pbjs = {
    getHighestCpmBids() {
      return highestCpmBids;
    },
    adUnits: opts.adUnits ? opts.adUnits : undefined
  }
}

/**
 * @func stubSession
 * @desc Stubs a session object to be set in sessionStorage
 * @param { Object } - stub configuration to be merged into default
 * @return { Object } - session object
**/

function stubSession(config = {}) {
  return Object.assign({
    organizationId: CONSTANTS.MOCK_UID,
    siteId: CONSTANTS.MOCK_UID,
    sessionId: 1,
    revenue: 2,
    prebidRevenue: 1,
    adserverRevenueRatio: 0.5,
    impressions: 2,
    prebidImpressions: 1,
    adserverImpressionRatio: 0.5,
    pageviews: 2,
    landingPath: '/test',
    currentPath: '/test',
    device: 'desktop',
    source: 'test.com',
    exp: new Date().getTime() + CONSTANTS.SESSION_STORAGE.TIMEOUT
  }, config);
}
