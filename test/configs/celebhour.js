/* eslint-disable quotes,no-floating-decimal,padded-blocks */
(function() {

  var PREBID_TIMEOUT = 1900;
  var BIDDR_HARD_FLOOR = 0;
  var PREBID_DEBUG = true;
  var THIRTYSEVENXCONFIG = {
    organizationId: 'tclJobp26NX',
    siteId: 'hJrApexiAfd'
  };

  /* Load prebid */

  window.pbjs = window.pbjs || {};
  window.pbjs.que = window.pbjs.que || [];

  /* Define adUnits */

  var adUnits = [{
    name: "/61424206/CelebHour_BTF_MPU1",
    code: "/61424206/CelebHour_BTF_MPU1",
    div: "div-gpt-ad-1505294636221-4",
    sizes: [
      [300, 250]
    ],
    bids: [{
      bidder: "appnexusAst",
      params: {
        placementId: 12055387
      }
    }, {
      bidder: "rubicon",
      params: {
        rp_account: "",
        rp_site: "",
        rp_zonesize: "",
        accountId: "15848",
        siteId: "152868",
        zoneId: "726018",
        sizes: "",
        keywords: "",
        inventory: "",
        visitor: "",
        position: "",
        userId: ""
      }
    }, {
      bidder: "pubmatic",
      params: {
        publisherId: "120658",
        adSlot: "CelebHour_BTF_MPU1@300x250"
      }
    }, {
      bidder: "sovrn",
      params: {
        tagid: "515696",
        sizes: ""
      }
    }, {
      bidder: "rhythmone",
      params: {
        placementId: 72756
      }
    }, {
      bidder: "pulsepoint",
      params: {
        cf: "300X250",
        cp: 560147,
        ct: 606186
      }
    }, {
      bidder: "brealtime",
      params: {
        placementId: "12099369"
      }
    }, {
      bidder: "appnexus",
      params: {
        placementId: "12057074",
        invCode: "",
        member: ""
      }
    }, {
      bidder: "defymedia",
      params: {
        placementId: "12021417"
      }
    }]
  }, {
    name: "/61424206/CelebHour_BTF_MPU2",
    code: "/61424206/CelebHour_BTF_MPU2",
    div: "div-gpt-ad-1505294636221-5",
    sizes: [
      [300, 250]
    ],
    bids: [{
      bidder: "appnexusAst",
      params: {
        placementId: 12055388
      }
    }, {
      bidder: "rubicon",
      params: {
        rp_account: "",
        rp_site: "",
        rp_zonesize: "",
        accountId: "15848",
        siteId: "152868",
        zoneId: "726020",
        sizes: "",
        keywords: "",
        inventory: "",
        visitor: "",
        position: "",
        userId: ""
      }
    }, {
      bidder: "pubmatic",
      params: {
        publisherId: "120658",
        adSlot: "CelebHour_BTF_MPU2@300x250"
      }
    }, {
      bidder: "sovrn",
      params: {
        tagid: "515697",
        sizes: ""
      }
    }, {
      bidder: "rhythmone",
      params: {
        placementId: 72756
      }
    }, {
      bidder: "pulsepoint",
      params: {
        cf: "300X250",
        cp: 560147,
        ct: 606187
      }
    }, {
      bidder: "brealtime",
      params: {
        placementId: "12099370"
      }
    }, {
      bidder: "appnexus",
      params: {
        placementId: "12057077",
        invCode: "",
        member: ""
      }
    }, {
      bidder: "defymedia",
      params: {
        placementId: "12021418"
      }
    }]
  }, {
    name: "/61424206/CelebHour_ATF_BB",
    code: "/61424206/CelebHour_ATF_BB",
    div: "div-gpt-ad-1505294636221-0",
    sizes: [
      [728, 90]
    ],
    bids: [{
      bidder: "appnexusAst",
      params: {
        placementId: 12055375
      }
    }, {
      bidder: "rubicon",
      params: {
        rp_account: "",
        rp_site: "",
        rp_zonesize: "",
        accountId: "15848",
        siteId: "152868",
        zoneId: "726010",
        sizes: "",
        keywords: "",
        inventory: "",
        visitor: "",
        position: "",
        userId: ""
      }
    }, {
      bidder: "pubmatic",
      params: {
        publisherId: "120658",
        adSlot: "CelebHour_ATF_BB@728x90"
      }
    }, {
      bidder: "sovrn",
      params: {
        tagid: "515689",
        sizes: ""
      }
    }, {
      bidder: "rhythmone",
      params: {
        placementId: 72756
      }
    }, {
      bidder: "pulsepoint",
      params: {
        cf: "728x90",
        cp: 560147,
        ct: 619978
      }
    }, {
      bidder: "brealtime",
      params: {
        placementId: "12099364"
      }
    }, {
      bidder: "appnexus",
      params: {
        placementId: "12057070",
        invCode: "",
        member: ""
      }
    }, {
      bidder: "defymedia",
      params: {
        placementId: "12055436"
      }
    }]
  }, {
    name: "/61424206/CelebHour_ATF_MPU2",
    code: "/61424206/CelebHour_ATF_MPU2",
    div: "div-gpt-ad-1505294636221-2",
    sizes: [
      [300, 600],
      [300, 250]
    ],
    bids: [{
      bidder: "appnexusAst",
      params: {
        placementId: 12055385
      }
    }, {
      bidder: "rubicon",
      params: {
        rp_account: "",
        rp_site: "",
        rp_zonesize: "",
        accountId: "15848",
        siteId: "152868",
        zoneId: "726014",
        sizes: "",
        keywords: "",
        inventory: "",
        visitor: "",
        position: "",
        userId: ""
      }
    }, {
      bidder: "pubmatic",
      params: {
        publisherId: "120658",
        adSlot: "CelebHour_ATF_MPU2@300x600"
      }
    }, {
      bidder: "sovrn",
      params: {
        tagid: "515694",
        sizes: ""
      }
    }, {
      bidder: "rhythmone",
      params: {
        placementId: 72756
      }
    }, {
      bidder: "pulsepoint",
      params: {
        cf: "300X600",
        cp: 560147,
        ct: 606184
      }
    }, {
      bidder: "brealtime",
      params: {
        placementId: "12099367"
      }
    }, {
      bidder: "appnexus",
      params: {
        placementId: "12057072",
        invCode: "",
        member: ""
      }
    }, {
      bidder: "defymedia",
      params: {
        placementId: "12021416"
      }
    }]
  }, {
    name: "/61424206/CelebHour_ATF_MPU1",
    code: "/61424206/CelebHour_ATF_MPU1",
    div: "div-gpt-ad-1505294636221-1",
    sizes: [
      [300, 600],
      [300, 250]
    ],
    bids: [{
      bidder: "appnexusAst",
      params: {
        placementId: 12055380
      }
    }, {
      bidder: "rubicon",
      params: {
        rp_account: "",
        rp_site: "",
        rp_zonesize: "",
        accountId: "15848",
        siteId: "152868",
        zoneId: "726012",
        sizes: "",
        keywords: "",
        inventory: "",
        visitor: "",
        position: "",
        userId: ""
      }
    }, {
      bidder: "pubmatic",
      params: {
        publisherId: "120658",
        adSlot: "CelebHour_ATF_MPU1@300x600"
      }
    }, {
      bidder: "sovrn",
      params: {
        tagid: "515692",
        sizes: ""
      }
    }, {
      bidder: "rhythmone",
      params: {
        placementId: 72756
      }
    }, {
      bidder: "pulsepoint",
      params: {
        cf: "300X600",
        cp: 560147,
        ct: 606181
      }
    }, {
      bidder: "brealtime",
      params: {
        placementId: "12099365"
      }
    }, {
      bidder: "appnexus",
      params: {
        placementId: "12057071",
        invCode: "",
        member: ""
      }
    }, {
      bidder: "defymedia",
      params: {
        placementId: "12021415"
      }
    }]
  }, {
    name: "/61424206/CelebHour_BTF_BU",
    code: "/61424206/CelebHour_BTF_BU",
    div: "div-gpt-ad-1505294636221-3",
    sizes: [
      [300, 250]
    ],
    bids: [{
      bidder: "appnexusAst",
      params: {
        placementId: 12055386
      }
    }, {
      bidder: "rubicon",
      params: {
        rp_account: "",
        rp_site: "",
        rp_zonesize: "",
        accountId: "15848",
        siteId: "152868",
        zoneId: "726016",
        sizes: "",
        keywords: "",
        inventory: "",
        visitor: "",
        position: "",
        userId: ""
      }
    }, {
      bidder: "pubmatic",
      params: {
        publisherId: "120658",
        adSlot: "CelebHour_BTF_BU@300x250"
      }
    }, {
      bidder: "sovrn",
      params: {
        tagid: "515689",
        sizes: ""
      }
    }, {
      bidder: "rhythmone",
      params: {
        placementId: 72756
      }
    }, {
      bidder: "pulsepoint",
      params: {
        cf: "300X250",
        cp: 560147,
        ct: 606185
      }
    }, {
      bidder: "brealtime",
      params: {
        placementId: "12099368"
      }
    }, {
      bidder: "appnexus",
      params: {
        placementId: "12057073",
        invCode: "",
        member: ""
      }
    }, {
      bidder: "defymedia",
      params: {
        placementId: "12021419"
      }
    }]
  }];

  window.pbjs.que.push(function() {

    /* Set Prebid config */

    window.pbjs.setConfig({
      enableSendAllBids: true,
      debug: PREBID_DEBUG
    });

    /* Add adUnits to prebid */

    window.pbjs.addAdUnits(adUnits);

    /* Set Prebid bidderSettings */

    window.pbjs.bidderSettings = {
      rubicon: {
        bidCpmAdjustment: function(e) {
          return .8 * e
        }
      },
      pubmatic: {
        bidCpmAdjustment: function(e) {
          return .85 * e
        }
      },
      brealtime: {
        bidCpmAdjustment: function(e) {
          return .8 * e
        }
      },
      appnexus: {
        bidCpmAdjustment: function(e) {
          return .8 * e
        }
      },
      defymedia: {
        bidCpmAdjustment: function(e) {
          return .8 * e
        }
      },
      standard: {
        adserverTargeting: [{
          key: "hb_bidder",
          val: function(e) {
            return e.bidderCode
          }
        }, {
          key: "hb_adid",
          val: function(e) {
            return e.adId
          }
        }, {
          key: "hb_pb",
          val: function(e) {
            var t, n = e.cpm;
            switch (!0) {
              case n >= 30:
                return 30;
              case n >= 15:
                t = .05;
                break;
              case n >= 10:
                t = .01;
                break;
              case n >= 5:
                t = .01;
                break;
              case n >= .05:
                t = .01;
                break;
              default:
                return 0
            }
            return n -= n % t, BIDDR_HARD_FLOOR > n && (n = 0), "" + n.toFixed(2)
          }
        }]
      }
    };

    /* Request bids */

    window.pbjs.requestBids({
      bidsBackHandler: sendAdserverRequest
    });
  });

  /* Enable 37x Analytics adapter */

  window.pbjs.que.push(function() {
    window.pbjs.enableAnalytics({
      provider: '37x',
      options: THIRTYSEVENXCONFIG
    });
  });

  /* Disable googletag initial load */

  window.googletag = window.googletag || {};
  window.googletag.cmd = window.googletag.cmd || [];
  window.googletag.cmd.push(function() {
    window.googletag.pubads().disableInitialLoad();
  });

  function sendAdserverRequest() {
    if (window.pbjs.adserverRequestSent) return;
    window.pbjs.adserverRequestSent = true;
    window.googletag.cmd.push(function() {
      window.pbjs.que.push(function() {
        window.pbjs.setTargetingForGPTAsync();
        window.googletag.pubads().refresh();
      });
    });
  }

  /* Send adserver request */

  setTimeout(function() {
    sendAdserverRequest();
  }, PREBID_TIMEOUT);

})();
