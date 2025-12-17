async function sleakScript() {
  const sleakbotScriptTag = document.querySelector('#sleakbot');
  const scriptSrc = sleakbotScriptTag.getAttribute('src');
  const chatbotId = sleakbotScriptTag.getAttribute('chatbot-id');
  const scriptCookies = sleakbotScriptTag.getAttribute('cookies');
  // env control
  if (scriptSrc.includes('dev') || scriptSrc.includes('localhost')) {
    var widgetBaseUrl = 'https://staging.sleak.chat';
  } else {
    var widgetBaseUrl = 'https://widget.sleak.chat';
  }

  let visitorId;

  function createNewCookie(key, value) {
    Cookies.set(key, value, {
      expires: 365,
      sameSite: 'None',
      secure: true
    });
  }

  if (!scriptCookies) {
    if (Cookies.get(`sleakVisitorId_${chatbotId}`)) {
      // console.log("cookie exists, value = ",Cookies.get(`sleakVisitorId_${chatbotId}`));
      // Resetting chat
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('resetChat')) {
        Cookies.remove(`sleakVisitorId_${chatbotId}`);
        visitorId = crypto.randomUUID();
        createNewCookie(`sleakVisitorId_${chatbotId}`, visitorId);
        urlParams.delete('resetChat');
        const updatedParams = urlParams.toString();
        const newUrl = updatedParams ? `${window.location.origin}${window.location.pathname}?${updatedParams}` : `${window.location.origin}${window.location.pathname}`;
        window.history.replaceState(null, '', newUrl);
      }

      visitorId = Cookies.get(`sleakVisitorId_${chatbotId}`);
    } else {
      visitorId = crypto.randomUUID();
      createNewCookie(`sleakVisitorId_${chatbotId}`, visitorId);
    }
  } else {
    // fallback to using localStorage
    if (localStorage.getItem(`sleakVisitorId_${chatbotId}`)) {
      // console.log("localStorage exists, value = ", localStorage.getItem(`sleakVisitorId_${chatbotId}`));
      visitorId = localStorage.getItem(`sleakVisitorId_${chatbotId}`);
    } else {
      visitorId = crypto.randomUUID();
      localStorage.setItem(`sleakVisitorId_${chatbotId}`, visitorId);
      // console.log("new localStorage = ", visitorId);
    }
  }

  const timestamp = new Date().getTime();
  const chatbotConfigEndpoint = `${widgetBaseUrl}/api/config?id=${chatbotId}&visitor_id=${visitorId}&t=${timestamp}`;
  const chatbotConfigRequest = await fetch(chatbotConfigEndpoint, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const rawChatbotConfigResponse = await chatbotConfigRequest.json();
  const chatbotConfig = rawChatbotConfigResponse.data.chatbot_config;

  let chatCreated = rawChatbotConfigResponse.data.chat_exists;
  let widgetOpenFlag = localStorage.getItem(`sleakWidget_${chatbotId}`);

  // main code
  if (chatbotConfig.publishing.published == true) {
    const sleakWrap = document.querySelector('#sleak-widgetwrap');
    const sleakButton = document.querySelector('#sleak-buttonwrap');
    var sleakPopup = document.querySelector('#sleak-popup-embed');
    const sleakEmbeddedWidget = document.querySelector('#sleak-body-embed');
    const sleakWidgetwrap = document.getElementById('sleak-widget-container');
    const liveChatPopup = document.getElementById('sleak-operatorchanged-popup');
    const chatInput = document.querySelector('.sleak-popup-chatinput-input-wrapper');
    const btnPulse = document.querySelector('#sleak-button-pulse');
    const btnNotificaiton = document.querySelector('#sleak-btn-notification-count');
    const isTypingIndicator = document.querySelector('#sleak-loader-container');
    const popupListWrap = document.querySelector('#popup-list-wrap');
    var sleakBtnContainer = document.querySelector('#sleak-btn-container');
    const sleakWidgetClosedBtn = document.querySelector('#sleak-widget-closed');
    const sleakWidgetOpenedBtn = document.querySelector('#sleak-widget-open');
    const sleakWidgetLoader = document.querySelector('#sleak-button-spinner');
    const slkPopupAvatar = document.querySelector('#sleak-popup-embed-avatar');
    const slkPopupAgentName = document.querySelector('#sleak-popup-embed-agentname');
    const slkPopupBodyMessage = document.querySelector('#sleak-popup-embed-body');

    var viewportWidth2 = window.innerWidth;

    function setStylingMobile() {
      var mobilePopupHeight = chatbotConfig.btn_offset.y_mobile + 82;
      console.log('mobilePopupHeight', mobilePopupHeight);
      sleakButton.setAttribute('style', 'right: ' + chatbotConfig.btn_offset.x_mobile + 'px; bottom: ' + chatbotConfig.btn_offset.y_mobile + 'px;');
      popupListWrap.setAttribute('style', 'right: ' + chatbotConfig.btn_offset.x_mobile + 'px; bottom: ' + mobilePopupHeight + 'px;');
    }

    function setStylingDesktop() {
      console.log('set  styling desktop');
      sleakWrap.setAttribute('style', 'right: ' + chatbotConfig.btn_offset.x_desktop + 'px; bottom: ' + chatbotConfig.btn_offset.y_desktop + 'px;');
    }

    function setStylingMobileMirrored() {
      var mobilePopupHeight = chatbotConfig.btn_offset.y_mobile + 82;
      sleakButton.setAttribute('style', 'left: ' + chatbotConfig.btn_offset.x_mobile + 'px; bottom: ' + chatbotConfig.btn_offset.y_mobile + 'px;');
      popupListWrap.setAttribute('style', 'left: ' + chatbotConfig.btn_offset.x_mobile + 'px; bottom: ' + mobilePopupHeight + 'px; align-items: start;');
      sleakWrap.style.alignItems = 'flex-start';
      sleakEmbeddedWidget.setAttribute('style', 'justify-content: flex-start !important');
    }

    function setStylingDesktopMirrored() {
      sleakWrap.setAttribute(
        'style',
        'left: ' + chatbotConfig.btn_offset.x_desktop + 'px; bottom: ' + chatbotConfig.btn_offset.y_desktop + 'px;' + 'width: 100vw; justify-content: flex-start; align-items: flex-start;'
      );
      sleakWidgetwrap.setAttribute('style', 'width: 28.75rem; height: 100%;');
      popupListWrap.setAttribute('style', 'right: unset; left: 0;');
      sleakButton.setAttribute('style', 'right: unset; left: 0; transform: scaleX(-1) !important');
      document.querySelector('#popup-list-wrap').style.alignItems = 'start';
    }
    console.log('viewportWidth2', viewportWidth2);
    if (viewportWidth2 < 1024) {
      console.log('set  styling mobile');
      if (!chatbotConfig.btn_offset.align_right || chatbotConfig.btn_offset.align_right.mobile !== false) {
        setStylingMobile();
      } else {
        setStylingMobileMirrored();
      }
    } else {
      if (!chatbotConfig.btn_offset.align_right || chatbotConfig.btn_offset.align_right.desktop !== false) {
        setStylingDesktop();
      } else {
        setStylingDesktopMirrored();
      }
    }

    // btn
    var btnColor = chatbotConfig.primary_color;
    sleakBtnContainer.style.backgroundColor = btnColor;
    if (chatbotConfig.background_image) {
      sleakBtnContainer.style.backgroundImage = `url("${chatbotConfig.background_image}")`;
      sleakWidgetOpenedBtn.style.opacity = '0';
      sleakWidgetClosedBtn.style.opacity = '0';
    }

    function slkShowBtn() {
      sleakButton.style.opacity = '0';
      sleakButton.style.transform = 'scale(0.8)';
      sleakButton.style.transition = 'all 0.1s ease';
      setTimeout(function () {
        sleakButton.style.opacity = '1';
        sleakButton.style.transform = 'scale(1)';
      }, 500);
    }
    slkShowBtn();

    // render iframes
    // var iframeBtn = document.getElementById('sleak-button-iframe');
    // iframeBtn.src = widgetBaseUrl + `/button/${chatbotId}`;

    let slkBodyRendered = false;
    var iframeWidgetbody = document.getElementById('sleak-widget-iframe');
    function slkRenderWidgetBody() {
      return new Promise(resolve => {
        iframeWidgetbody.src = widgetBaseUrl + `/${chatbotId}?id=${visitorId}`;
        iframeWidgetbody.addEventListener('load', () => resolve(), { once: true });
      });
    }
    if (chatCreated || widgetOpenFlag) {
      // console.log('chat created or widget already opened, rendering widget');
      slkRenderWidgetBody();
      slkBodyRendered = true;
    }

    let sleakWidgetOpenState = false;
    let firstButtonClick = true;

    // widget preview
    if (window.location.href.includes('preview.sleak.chat/')) {
      if (!slkBodyRendered) {
        slkRenderWidgetBody();
        slkBodyRendered = true;
      }
      if (window.innerWidth > 1024) {
        setTimeout(() => {
          if (sleakWidgetOpenState == false) window.toggleSleakWidget();
        }, 2000);
      }
    }

    // var iframePopup = document.getElementById('sleak-popup-iframe');
    // iframePopup.src = widgetBaseUrl + `/popup/${chatbotId}`;

    slkPopupAvatar.src = chatbotConfig.avatar_url;
    slkPopupAgentName.innerHTML = chatbotConfig.name;
    slkPopupBodyMessage.innerHTML = chatbotConfig.first_message;

    document.querySelector('#sleak-popup-embed-closebtn-icon').addEventListener('click', function (event) {
      event.stopPropagation();
      closeSleakWidget();
    });

    async function setShadow() {
      // delay setting shadow to avoid flickering
      await new Promise(resolve => setTimeout(resolve, 50));
      iframeWidgetbody.style.boxShadow = '0px 4px 8px -2px rgba(0, 0, 0, 0.1)';
    }

    function openSleakWidget() {
      sleakEmbeddedWidget.style.display = 'flex';

      sleakWidgetwrap.style.transform = 'translateY(20px)';
      // sleakEmbeddedWidget.style.transform = 'translateY(800px)';
      // sleakEmbeddedWidget.style.transform = 'scale(0.99)';

      sleakEmbeddedWidget.style.opacity = '0';
      sleakPopup.style.display = 'none';
      chatInput.style.display = 'none';
      liveChatPopup.style.display = 'none';
      btnPulse.style.display = 'none';
      btnNotificaiton.style.display = 'none';
      isTypingIndicator.style.display = 'none';

      sleakEmbeddedWidget.style.transition = 'opacity 0.15s ease-in-out';
      sleakEmbeddedWidget.style.transition = 'transform 0.15s ease-in-out';
      sleakWidgetwrap.style.transition = 'transform 0.15s ease-in-out';

      setTimeout(function () {
        sleakEmbeddedWidget.style.opacity = '1';
        sleakWidgetwrap.style.transform = 'translateY(0)';
        // sleakEmbeddedWidget.style.transform = 'translateY(0)';
        // sleakEmbeddedWidget.style.transform = 'scale(1)';
      }, 50);
    }

    window.closeSleakWidget = function () {
      sleakEmbeddedWidget.classList.remove('open');
      iframeWidgetbody.classList.remove('open');

      sleakEmbeddedWidget.style.display = 'none';
      sleakPopup.style.display = 'none';
    };

    // widget opening

    // async function changeButtonState(state) {
    //   var iframeBtnWindow = document.getElementById('sleak-button-iframe').contentWindow;

    //   if (state == true) {
    //     iframeBtnWindow.postMessage('openButton', '*');
    //     iframeWidgetbody.contentWindow.postMessage('openButton', '*');
    //   } else if (state == false) {
    //     iframeBtnWindow.postMessage('closeButton', '*');
    //   }
    // }

    window.toggleSleakWidget = async function () {
      // check if widget is open
      if (sleakWidgetOpenState == false) {
        sleakWidgetClosedBtn.style.display = 'none';
        sleakWidgetOpenedBtn.style.display = 'flex';
        if (firstButtonClick && !slkBodyRendered) {
          // sleakWidgetLoader.style.display = 'block';
          // console.log('Rendering widget body...');
          await slkRenderWidgetBody();
          // sleakWidgetLoader.style.display = 'none';
          sleakWidgetOpenState = true;
          // console.log('Widget body rendered.');
          // changeButtonState(true);
        } else {
          sleakWidgetOpenState = true;
          // changeButtonState(true);
        }

        openSleakWidget();

        if (window.matchMedia('(max-width: 768px)').matches) {
          document.body.style.overflow = 'hidden';
        }

        const viewportHeight = window.innerHeight;
        sleakWrap.style.height = viewportHeight + 'px';
        sleakWrap.style.minHeight = viewportHeight + 'px';

        /// check for first button click of page load
        if (firstButtonClick) {
          if (!widgetOpenFlag) {
            // for hiding popup after widget open
            widgetOpenFlag = true;
            localStorage.setItem(`sleakWidget_${chatbotId}`, crypto.randomUUID());
          }

          if (firstButtonClick) firstButtonClick = false;
        }
      } else if (sleakWidgetOpenState == true) {
        sleakWidgetClosedBtn.style.display = 'flex';
        sleakWidgetOpenedBtn.style.display = 'none';

        sleakWidgetOpenState = false;
        // changeButtonState(false);
        // console.log(sleakWidgetOpenState);
        closeSleakWidget();

        if (window.matchMedia('(max-width: 768px)').matches) {
          document.body.style.overflow = 'auto';
        }
      }
    };

    // event listener for scrolling
    if (window.matchMedia('(max-width: 768px)').matches) {
      window.addEventListener('scroll', function () {
        if (sleakWidgetOpenState == true) {
          const viewportHeightScroll = window.innerHeight;
          document.getElementById('sleak-widgetwrap').style.height = viewportHeightScroll + 'px';
          document.getElementById('sleak-widgetwrap').style.minHeight = viewportHeightScroll + 'px';
        }
      });
    }

    // disable popup/chime after first page load
    var sessionStorageKey = chatbotId + '_sleakPopupTriggered';
    var hasPopupBeenTriggered = sessionStorage.getItem(sessionStorageKey);
    // var hasPopupBeenTriggered = false; // remove line in prod

    let blockDefaultPopup = false;
    var sessionStorageTriggerBased = chatbotId + '_sleakTriggerbasedPopupTriggered';

    // Chime & popup

    function showPopup() {
      sleakPopup.style.display = 'flex';
      sleakPopup.style.opacity = '0';
      sleakPopup.style.transform = 'translateY(20px)';
      sleakPopup.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      setTimeout(function () {
        sleakPopup.style.opacity = '1';
        sleakPopup.style.transform = 'translateY(0)';
      }, 50);
      sessionStorage.setItem(sessionStorageKey, 'true');
    }

    let sleakChime = new Audio('https://sygpwnluwwetrkmwilea.supabase.co/storage/v1/object/public/app/assets/sleak-chime.mp3');
    let sleakChimeOperator = new Audio('https://sygpwnluwwetrkmwilea.supabase.co/storage/v1/object/public/app/assets/sleak-chime-operatorjoined.mp3');
    let userHasInteracted = false;
    window.addEventListener('click', () => (userHasInteracted = true), { once: true });
    window.addEventListener('keydown', () => (userHasInteracted = true), { once: true });
    function playAudio(audio) {
      if (!userHasInteracted) return;
      try {
        audio.play();
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }

    // console.log(sleakWidgetOpenState);

    let pagePath = window.location.pathname;
    // pagePath = '/asdf'; // remove limne in prod
    // console.log('pagePath:', pagePath);
    const popupRules = chatbotConfig.popups?.rules || [];
    // console.log('popupRules:', popupRules);

    let pagePopup;
    if (popupRules.length > 0) {
      pagePopup = popupRules.find(rule => rule.page == pagePath);
      if (pagePopup) {
        // console.log('rendering widget body');
        slkRenderWidgetBody();
        slkBodyRendered = true;
        // console.log('disabling default popup as pagePopup exists = ', pagePopup);
        blockDefaultPopup = true;
        // console.log('blockDefaultPopup = ', blockDefaultPopup);
      }
    }

    async function showTriggerBasedPopup(payload) {
      // console.log('showing livechat popup with payload = ', payload);

      // populate default popup
      slkPopupAvatar.src = payload.avatar;
      slkPopupAgentName.innerHTML = payload.name;
      slkPopupBodyMessage.innerHTML = pagePopup.message;

      liveChatPopup.querySelector('#sleak-operatorchanged-avatar').src = payload.avatar;
      liveChatPopup.querySelector('#sleak-operatorchanged-name').innerText = payload.name;

      if (!sleakWidgetOpenState) {
        liveChatPopup.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        liveChatPopup.style.transform = 'translateY(20px)';
        liveChatPopup.style.opacity = '0';
        liveChatPopup.style.display = 'flex';
        setTimeout(function () {
          liveChatPopup.style.opacity = '1';
          liveChatPopup.style.transform = 'translateY(0)';
        }, 50);
        setTimeout(() => (isTypingIndicator.style.display = 'flex'), 1000);

        playAudio(sleakChimeOperator);
      }
      setTimeout(() => (isTypingIndicator.style.display = 'none'), 6000);
      setTimeout(function () {
        blockDefaultPopup = false;
        if (!chatCreated) {
          // console.log('showing main popup');
          if (!sleakWidgetOpenState) {
            showPopup();
            playAudio(sleakChime);
          }
        }
        setTimeout(function () {
          if (!sleakWidgetOpenState) {
            chatInput.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            chatInput.style.transform = 'translateY(20px)';
            chatInput.style.opacity = '0';
            chatInput.style.display = 'flex';
            setTimeout(function () {
              chatInput.style.opacity = '1';
              chatInput.style.transform = 'translateY(0)';
            }, 50);

            btnPulse.style.display = 'flex';
            btnPulse.style.opacity = '1';
            btnPulse.style.transform = 'scale(1)';

            btnNotificaiton.style.transform = 'scale(0.5)';
            btnNotificaiton.style.display = 'flex';
            setTimeout(function () {
              btnNotificaiton.style.opacity = '1';
              btnNotificaiton.style.transform = 'scale(1)';
            }, 50);
          }
        }, 500);
      }, 7000);

      // sessionStorageTriggerBased.setItem(sessionStorageKey, 'true');
    }

    if (!hasPopupBeenTriggered && !blockDefaultPopup) {
      // console.log('popup localStorage does not exist');

      const viewportWidth = window.innerWidth;
      // console.log(viewportWidth);

      if (viewportWidth < 479) {
        if (chatbotConfig.popup.mobile == true) {
          setTimeout(function () {
            if (sleakWidgetOpenState == false) {
              showPopup();
              if (chatbotConfig.popup.chime.mobile == true) {
                playAudio(sleakChime);
              }
            }
          }, 6000);
        }
      } else {
        if (chatbotConfig.popup.desktop == true) {
          setTimeout(function () {
            if (sleakWidgetOpenState == false) {
              showPopup();
              if (chatbotConfig.popup.chime.desktop == true) {
                playAudio(sleakChime);
              }
            }
          }, 6000);
        }
      }
    }

    // Mobile visibility change detection
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      console.log('Mobile device detected, setting up visibility change listener');
      document.addEventListener('visibilitychange', function () {
        const visibilityState = document.visibilityState;
        console.log('Visibility changed:', visibilityState);

        if (iframeWidgetbody && iframeWidgetbody.contentWindow) {
          console.log('Sending visibility change to iframe:', visibilityState);
          iframeWidgetbody.contentWindow.postMessage(
            {
              type: 'visibilityChange',
              payload: {
                state: visibilityState,
                timestamp: new Date().toISOString()
              }
            },
            '*'
          );
        } else {
          console.log('Widget iframe not available to send visibility change');
        }
      });
    } else {
      console.log('Not a mobile device, visibility change listener not added');
    }

    // child window event handling
    async function pushGtmEvent() {
      var dataLayer = window.dataLayer || (window.dataLayer = []);
      dataLayer.push({
        event: event.data,
        postMessageData: event
      });
      // console.log('Pushed to dataLayer:', event);
    }

    window.addEventListener('message', event => {
      if (event.origin === 'https://staging.sleak.chat' || event.origin === 'https://widget.sleak.chat') {
        // console.log('Received message:', event);

        if (event.data === 'closePopup') {
          closeSleakWidget();
        } else if (event.data === 'toggleChat') {
          toggleSleakWidget();
        } else if (event.data === 'operatorMessage') {
          playAudio(sleakChime);
        } else if (event.data === 'operatorChanged') {
          playAudio(sleakChimeOperator);
        } else if (event.data === 'domInitialized') {
          const sleakPageLoad = {
            type: 'sleakPageLoad',
            payload: {
              currentPath: pagePath,
              fullUrl: window.location.href
            }
          };

          iframeWidgetbody.contentWindow.postMessage(sleakPageLoad, '*');
          // iframePopup.contentWindow.postMessage(sleakPageLoad, '*');

          setShadow();
          eventHandling();
        } else if (event.data === 'sleakChatInitiated') {
          pushGtmEvent(event);
        } else if (event.data === 'sleakSentContactDetails') {
          pushGtmEvent(event);
        } else if (event.data === 'sleakHumanHandoffActivated') {
          pushGtmEvent(event);
        } else if (event.data.type === 'chatCreated') {
          // console.log('chat created = ', event);

          localStorage.setItem(`slkChatCreated_${chatbotId}_${visitorId}`, 'true');
          localStorage.removeItem(`slkLocalEventQueue_${chatbotId}_${visitorId}`);
          chatCreated = true;
          // console.log('created chat localstorage ');
        } else if (event.data.type === 'initiateTriggerBasedPopup') {
          // console.log('trigger initiateTriggerBasedPopup = ', event);
          showTriggerBasedPopup(event.data.payload);
        } else {
          if (event.data.type !== 'showOutputLogsAdmin') console.log('no declared event');
        }
      }
    });

    function eventHandling() {
      if (!chatCreated) {
        if (!localStorage.getItem(`slkLocalEventQueue_${chatbotId}_${visitorId}`)) {
          localStorage.setItem(`slkLocalEventQueue_${chatbotId}_${visitorId}`, JSON.stringify([]));
          // console.log('created slkLocalEventQueue localstorage');
        } else {
          const rawEvents = localStorage.getItem(`slkLocalEventQueue_${chatbotId}_${visitorId}`);

          const parsedEvents = JSON.parse(rawEvents);

          handleEvent({
            type: 'sleakInitialEvents',
            payload: {
              events: parsedEvents
            }
          });
          // console.log('posted initial events =', parsedEvents);
        }
      }

      function handleEvent(event) {
        // console.log('Captured Event:', event);

        if (!chatCreated && event.type == 'sleakNewEvent') {
          const cookieKey = `slkLocalEventQueue_${chatbotId}_${visitorId}`;

          let currentEvents = localStorage.getItem(cookieKey);
          currentEvents = currentEvents ? JSON.parse(currentEvents) : [];

          currentEvents.push(event);

          if (currentEvents.length > 100) {
            currentEvents = currentEvents.slice(-100);
          }
          localStorage.setItem(cookieKey, JSON.stringify(currentEvents));
          // console.log('updated localstorage', localStorage.getItem(cookieKey));
        }

        if (iframeWidgetbody && iframeWidgetbody.contentWindow) {
          iframeWidgetbody.contentWindow.postMessage(event, '*');
        }
      }

      async function interceptGlobalEvents() {
        const eventGroups = {
          form_submission: ['submit', 'formSubmit'],
          purchase: ['purchase', 'orderComplete', 'orderPlaced', 'order_complete', 'order_placed'],
          add_to_cart: ['addToCart', 'add_to_cart'],
          login: ['logIn', 'log_in', 'login'],
          sign_up: ['signUp', 'signup', 'sign_up']
        };

        function extractEventConfig(event) {
          const eventConfig = {};

          // For form submissions, extract the target element details
          if (event.type === 'submit' || event.type === 'formSubmit') {
            eventConfig.formName = event.target ? event.target.name || event.target.id || null : null;
          }

          // For e-commerce-related events, extract order details if available
          if (['purchase', 'orderComplete', 'orderPlaced', 'order_complete', 'order_placed'].includes(event.type)) {
            // Check if event has a `detail` property containing order info
            if (event.detail) {
              eventConfig = event.detail || {};
            }
          }

          return eventConfig;
        }

        // Loop through groups and set eventlisteners
        Object.entries(eventGroups).forEach(([group, events]) => {
          events.forEach(event => {
            document.addEventListener(event, function (eventDetails) {
              handleEvent({
                type: 'sleakNewEvent',
                payload: {
                  timestamp: new Date().toISOString(),
                  type: 'web_event',
                  event_group: group,
                  event: eventDetails.type,
                  event_config: extractEventConfig(eventDetails)
                }
              });
            });
          });
        });
      }

      interceptGlobalEvents();

      async function currentUrlEvent() {
        handleEvent({
          type: 'sleakNewEvent',
          payload: {
            timestamp: new Date().toISOString(),
            type: 'web_event',
            event_group: 'page_view',
            event: 'DOMContentLoaded',
            event_config: {
              url: window.location.href
            }
          }
        });
      }
      currentUrlEvent();

      // custom fields
      function customFields() {
        const customFieldsConfig = chatbotConfig.custom_fields_config;
        // // example payload for the custom_fields_config object
        // customFieldsConfig = [
        //   {
        //     key: 'email',
        //     updateChatName: true
        //   },
        //   {
        //     key: 'user_id',
        //     updateChatName: false
        //   }
        // ];
        // console.log('customFieldsConfig:', customFieldsConfig);

        // end user will push custom fields in an object to this function
        window.sleakPushCustomFields = function (customFields) {
          console.log('customFields:', customFields);
          // validate if the object is valid
          if (!customFields || typeof customFields !== 'object') {
            console.error('invalid type. object expected.');
            return;
          }
          // validate if object is not empty, and keys exist in config
          const validKeys = Object.keys(customFields).filter(key => customFieldsConfig.map(cf => cf.key).includes(key));
          const invalidKeys = Object.keys(customFields).filter(key => !customFieldsConfig.map(cf => cf.key).includes(key));

          if (invalidKeys.length > 0) {
            console.error(`invalid custom fields: ${invalidKeys.join(', ')}`);
            return;
          }
          if (validKeys.length === 0) {
            console.error('no valid custom fields to push');
            return;
          }
          // validate if there are empty values
          const emptyValues = validKeys.filter(key => customFields[key] === '');
          if (emptyValues.length > 0) {
            console.error(`empty custom field values: ${emptyValues.join(', ')}`);
            return;
          }

          console.log('valid custom fields:', customFields);

          // push the valid custom fields
          handleEvent({
            type: 'updateCustomFields',
            payload: {
              timestamp: new Date().toISOString(),
              customFields: customFields
            }
          });
        };

        // dispatch event when custom fields can be updated
        window.dispatchEvent(new CustomEvent('sleakCustomFieldsHandlerInitialized'));

        // set example payload for the customFields argument and call function
        // examplePayload = {
        //   email: 'email@email.com',
        //   user_id: '123456'
        // };
        // window.sleakPushCustomFields(examplePayload);
      }

      // console.log('chatbotConfig', chatbotConfig);
      if (chatbotConfig.custom_fields_config) customFields();
    }
  }
}

sleakScript();
