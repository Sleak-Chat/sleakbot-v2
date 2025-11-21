(async function () {
  if (!window.sleakScriptInjected) {
    window.sleakScriptInjected = true;
  } else {
    return;
  }

  async function injectSleakScript(chatbotId, instanceNumber = null) {
    // if (!['793042b0-1a02-4cec-ae45-502cb7983d17', 'f71a3fb5-7dcd-4611-878a-39a78c5b334f'].includes(chatbotId)) return;

    // env control
    if (scriptSrc.includes('dev')) {
      baseUrl = 'https://sleak-chat.github.io/sleakbot-v2';
      widgetBaseUrl = 'https://widget-v2-sigma.vercel.app';
    } else if (scriptSrc.includes('localhost')) {
      baseUrl = 'http://localhost:8000';
      widgetBaseUrl = 'https://widget-v2-sigma.vercel.app';
    } else {
      baseUrl = 'https://cdn.sleak.chat';
      widgetBaseUrl = 'https://widget.sleak.chat';
    }
    const fileName = placement === 'fullwidth' ? 'sleakbot-fw' : 'sleakbot';

    const sleakHtml = `${baseUrl}/${fileName}.html`;
    const sleakCss = `${baseUrl}/${fileName}.css`;

    async function appendStylesheet(url) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = url;
      link.id = 'sleak-css';
      document.head.appendChild(link);
    }
    appendStylesheet(sleakCss);

    // append div to body
    function appendSleakHtmlToBody(sleak_html) {
      const sleakHtml = document.createElement('div');
      sleakHtml.innerHTML = sleak_html;
      sleakHtml.id = 'sleak-html';
      if (placement === 'fullwidth') {
        sleakHtml.style.width = '100%';
        sleakHtml.style.height = '100%';
        if (instanceNumber) {
          const instanceElement = document.querySelector(`[slk-instance='${instanceNumber}']`);
          instanceElement.parentNode.insertBefore(sleakHtml, instanceElement.nextSibling);
        } else {
          sleakbotScriptTag.parentNode.insertBefore(sleakHtml, sleakbotScriptTag.nextSibling);
        }
      } else {
        document.body.appendChild(sleakHtml);
      }
    }

    // function appendSleakJsToBody() {
    //   // open widget

    // }

    function fetchAndAppendHtml() {
      return fetch(sleakHtml)
        .then(sleak_response => {
          return sleak_response.text();
        })
        .then(sleak_html => {
          appendSleakHtmlToBody(sleak_html);
        });
    }

    setTimeout(function () {
      fetchAndAppendHtml()
        .then(() => {
          executeSleakbotJs(chatbotId, instanceNumber);
          // console.log('sleak.chat initialized');
        })
        .catch(error => {
          console.error('Error occurred while loading sleak.chat:', error);
        });
    }, 10);
  }

  const sleakbotScriptTag = document.querySelector('#sleakbot');

  const scriptCookies = sleakbotScriptTag.getAttribute('cookies');
  const scriptSrc = sleakbotScriptTag.getAttribute('src');
  const placement = sleakbotScriptTag.getAttribute('placement');
  // console.log('placement =', placement);
  let baseUrl;
  let widgetBaseUrl;

  const isInstance = sleakbotScriptTag.getAttribute('slk-instance');
  let instances = null;

  function domReady() {
    return new Promise(resolve => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }

  if (isInstance) {
    domReady().then(() => {
      instances = document.querySelectorAll(`[slk-instance]`);
      console.log('instances =', instances);

      instances.forEach(instance => {
        const instanceNumber = instance.getAttribute('slk-instance');
        const chatbotId = instance.getAttribute('chatbot-id');
        injectSleakScript(chatbotId, instanceNumber);
      });
    });
  } else {
    const chatbotId = sleakbotScriptTag.getAttribute('chatbot-id');
    injectSleakScript(chatbotId);
  }

  async function executeSleakbotJs(chatbotId, instanceNumber = null) {
    let visitorId;

    if (!scriptCookies) {
      function setCookie(key, value, options = {}) {
        const encodedKey = encodeURIComponent(key);
        const encodedValue = encodeURIComponent(value);
        let cookie = `${encodedKey}=${encodedValue}`;

        if (options.expires) {
          const date = new Date();
          date.setTime(date.getTime() + options.expires * 86400000);
          cookie += `; expires=${date.toUTCString()}`;
        }
        if (options.path) cookie += `; path=${options.path}`;
        if (options.domain) cookie += `; domain=${options.domain}`;
        if (options.secure) cookie += `; secure`;
        if (options.sameSite) cookie += `; samesite=${options.sameSite}`;

        document.cookie = cookie;
      }

      function getCookie(key) {
        const encodedKey = encodeURIComponent(key) + '=';
        const cookies = document.cookie.split('; ');
        for (let c of cookies) {
          if (c.startsWith(encodedKey)) {
            return decodeURIComponent(c.substring(encodedKey.length));
          }
        }
        return null;
      }

      function deleteCookie(key, options = {}) {
        setCookie(key, '', { ...options, expires: -1 });
      }

      visitorId = getCookie(`sleakVisitorId_${chatbotId}`);

      if (visitorId) {
        // console.log("cookie exists, value = ",Cookies.get(`sleakVisitorId_${chatbotId}`));
        // Resetting chat
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('resetChat')) {
          deleteCookie(`sleakVisitorId_${chatbotId}`, { path: '/' });
          visitorId = crypto.randomUUID();
          setCookie(`sleakVisitorId_${chatbotId}`, visitorId, {
            expires: 365,
            sameSite: 'None',
            secure: true,
            path: '/'
          });
          urlParams.delete('resetChat');
          const updatedParams = urlParams.toString();
          const newUrl = updatedParams ? `${window.location.origin}${window.location.pathname}?${updatedParams}` : `${window.location.origin}${window.location.pathname}`;
          window.history.replaceState(null, '', newUrl);
        }

        visitorId = visitorId = getCookie(`sleakVisitorId_${chatbotId}`);
      } else {
        visitorId = crypto.randomUUID();
        setCookie(`sleakVisitorId_${chatbotId}`, visitorId, {
          expires: 365,
          sameSite: 'None',
          secure: true,
          path: '/'
        });
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
      async function setShadow() {
        // delay setting shadow to avoid flickering
        await new Promise(resolve => setTimeout(resolve, 50));
        iframeWidgetbody.style.boxShadow = '0px 4px 8px -2px rgba(0, 0, 0, 0.1)';
      }
      let sleakChime = new Audio('https://cdn.sleak.chat/assets/sleak-chime.mp3');
      let sleakChimeOperator = new Audio('https://cdn.sleak.chat/assets/sleak-chime-operatorjoined.mp3');
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

      let pagePath = window.location.pathname;
      let iframeWidgetbody;

      window.resetVisitorId = function () {
        deleteCookie(`sleakVisitorId_${chatbotId}`, { path: '/' });
        visitorId = crypto.randomUUID();
        setCookie(`sleakVisitorId_${chatbotId}`, visitorId, {
          expires: 365,
          sameSite: 'None',
          secure: true,
          path: '/'
        });
        iframeWidgetbody.src = widgetBaseUrl + `/${chatbotId}?id=${visitorId}`;
      };

      if (placement == 'fullwidth') {
        if (instanceNumber) {
          var slkInstance = document.querySelector(`[slk-instance='${instanceNumber}']`);
          iframeWidgetbody = slkInstance.nextSibling.querySelector('#sleak-widget-iframe');
        } else {
          iframeWidgetbody = document.querySelector('#sleak-widget-iframe');
        }
        iframeWidgetbody.src = widgetBaseUrl + `/${chatbotId}?id=${visitorId}&placement=fullwidth`;
      } else {
        iframeWidgetbody = document.getElementById('sleak-widget-iframe');
        const sleakWrap = document.querySelector('#sleak-widgetwrap');
        const sleakButton = document.querySelector('#sleak-buttonwrap');
        var sleakPopup = document.querySelector('#sleak-popup-embed');
        const sleakEmbeddedWidget = document.querySelector('#sleak-body-embed');
        const sleakWidgetwrap = document.getElementById('sleak-widget-container');
        const liveChatPopup = document.getElementById('sleak-operatorchanged-popup');
        const chatInput = document.querySelector('.sleak-popup-chatinpupt-input-wrapper');
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
          var mobilePopupHeight = Number(chatbotConfig.btn_offset.y_mobile) + 82;
          sleakButton.style.right = `${chatbotConfig.btn_offset.x_mobile}px`;
          sleakButton.style.bottom = `${chatbotConfig.btn_offset.y_mobile}px`;
          popupListWrap.style.right = `${chatbotConfig.btn_offset.x_mobile}px`;
          popupListWrap.style.bottom = `${mobilePopupHeight}px`;
        }

        function setStylingDesktop() {
          sleakWrap.style.right = `${chatbotConfig.btn_offset.x_desktop}px`;
          sleakWrap.style.bottom = `${chatbotConfig.btn_offset.y_desktop}px`;
        }

        function setStylingMobileMirrored() {
          var mobilePopupHeight = Number(chatbotConfig.btn_offset.y_mobile) + 82;
          sleakButton.style.left = `${chatbotConfig.btn_offset.x_mobile}px`;
          sleakButton.style.bottom = `${chatbotConfig.btn_offset.y_mobile}px`;
          popupListWrap.style.left = `${chatbotConfig.btn_offset.x_mobile}px`;
          popupListWrap.style.bottom = `${mobilePopupHeight}px`;
          popupListWrap.style.alignItems = 'start';
          sleakWrap.style.alignItems = 'flex-start';
          sleakEmbeddedWidget.style.setProperty('justify-content', 'flex-start', 'important');
        }

        function setStylingDesktopMirrored() {
          Object.assign(sleakWrap.style, {
            left: `${chatbotConfig.btn_offset.x_desktop}px`,
            bottom: `${chatbotConfig.btn_offset.y_desktop}px`,
            width: '100vw',
            justifyContent: 'flex-start',
            alignItems: 'flex-start'
          });

          Object.assign(sleakWidgetwrap.style, {
            width: '420px',
            height: '100%'
          });

          Object.assign(popupListWrap.style, {
            right: 'unset',
            left: '0'
          });

          Object.assign(sleakButton.style, {
            right: 'unset',
            left: '0'
          });
          sleakButton.style.setProperty('transform', 'scaleX(-1)', 'important');

          document.querySelector('#popup-list-wrap').style.alignItems = 'start';
        }

        if (viewportWidth2 < 1024) {
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

        let slkBodyRendered = false;
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

        window.sleakWidgetOpenState = false;
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

        window.populatePopup = function (avatar, name, message) {
          slkPopupAvatar.src = avatar;
          slkPopupAgentName.textContent = name;
          slkPopupBodyMessage.textContent = message;
        };

        // Set initial popup content
        window.populatePopup(chatbotConfig.avatar_url, chatbotConfig.name, chatbotConfig.first_message);

        function openSleakWidget() {
          sleakEmbeddedWidget.style.display = 'flex';
          sleakWidgetwrap.style.transform = 'translateY(20px)';

          sleakEmbeddedWidget.style.opacity = '0';
          sleakPopup.style.display = 'none';

          // triggerbased
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
          }, 50);
        }

        window.closeSleakWidget = function () {
          sleakEmbeddedWidget.classList.remove('open');
          iframeWidgetbody.classList.remove('open');

          sleakEmbeddedWidget.style.display = 'none';
          sleakPopup.style.display = 'none';

          chatInput.style.display = 'none';
          liveChatPopup.style.display = 'none';
          btnPulse.style.display = 'none';
          btnNotificaiton.style.display = 'none';
          isTypingIndicator.style.display = 'none';
        };

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
            closeSleakWidget();

            if (window.matchMedia('(max-width: 768px)').matches) {
              document.body.style.overflow = 'auto';
            }
          }
        };

        (async function btnClickEventHandling() {
          document.querySelectorAll('[open-widget]').forEach(btn => {
            btn.addEventListener('click', function () {
              toggleSleakWidget();
            });
          });

          document.querySelector('[close-widget]').addEventListener('click', function (event) {
            event.stopPropagation();
            closeSleakWidget();
          });
        })();

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

        // console.log(sleakWidgetOpenState);

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

        window.showTriggerBasedPopup = async function (payload) {
          // console.log('showing livechat popup with payload = ', payload);

          document.documentElement.style.setProperty('--sleak-loading-dot-color', chatbotConfig.primary_color);

          window.populatePopup(payload.avatar, payload.name, pagePopup.message);

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
        };

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

        (async function prefillMessage() {
          window.sendMessageToSleakbot = async function (message) {
            iframeWidgetbody.contentWindow.postMessage(
              {
                type: 'prefillMessage',
                payload: { message }
              },
              '*'
            );
            if (!sleakWidgetOpenState) {
              window.toggleSleakWidget();
            }
          };
          document.querySelectorAll('[slk-prefill-form]').forEach(form => {
            form.addEventListener('submit', async function (e) {
              e.preventDefault();
              if (!slkBodyRendered) {
                await slkRenderWidgetBody();
                slkBodyRendered = true;
              }
              setTimeout(() => {
                const message = form.querySelector('[slk-prefill-message]').value;
                window.sendMessageToSleakbot(message);
                // clear the form
                form.reset();
              }, 200);
            });
          });
        })();
      }

      document.addEventListener('visibilitychange', function () {
        const visibilityState = document.visibilityState;
        // console.log('Visibility changed:', visibilityState);

        if (iframeWidgetbody && iframeWidgetbody.contentWindow) {
          // console.log('Sending visibility change to iframe:', visibilityState);
          iframeWidgetbody.contentWindow.postMessage(
            {
              type: 'visibilityChange',
              payload: {
                state: visibilityState
              }
            },
            '*'
          );
        } else {
          // console.log('Widget iframe not available to send visibility change');
        }
      });

      if (scriptSrc.includes('dev')) {
        ['log', 'warn', 'error'].forEach(type => {
          const orig = console[type];
          console[type] = (...args) => {
            orig(...args);
            fetch('https://xvqjuiyrmzkhsfosfozs.supabase.co/rest/v1/consolelogs', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apikey:
                  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2cWp1aXlybXpraHNmb3Nmb3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkzMDgyNDQsImV4cCI6MjAzNDg4NDI0NH0.l4EDmKGcSXAolPPAfjL4X1X9T6cxIO0bg9s6oAbu_3E'
              },
              body: JSON.stringify({
                type,
                message: args.map(a => String(a)).join(' '),
                timestamp: new Date().toISOString(),
                visitor_id: visitorId,
                chatbot_id: chatbotId,
                window: 'parent'
              })
            });
          };
        });
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

      if (slkInstance) return;

      window.addEventListener('message', event => {
        if (event.origin === 'https://widget-v2-sigma.vercel.app/' || event.origin === 'https://widget.sleak.chat') {
          // console.log('Received message:', event);

          if (event.data === 'closePopup') {
            closeSleakWidget();
          } else if (event.data === 'toggleChat') {
            // console.log('toggleChat');
            toggleSleakWidget();
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

            // console.log('sleakPageLoad =', sleakPageLoad);

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
            window.showTriggerBasedPopup(event.data.payload);
          } else if (event.data.type === 'resetChat') {
            window.resetVisitorId();
          } else if (event.data.type === 'showMessagePopup') {
            window.populatePopup(event.data.payload.avatar, event.data.payload.name, event.data.payload.message);
            if (!window.sleakWidgetOpenState) showPopup();
            playAudio(sleakChime);
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
          const eventPayload = {
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
          };
          // console.log('currentUrlEvent full payload:', JSON.stringify(eventPayload, null, 2));
          handleEvent(eventPayload);
        }
        currentUrlEvent();

        if (!chatCreated) {
          // local event queue for if chat does not exist
          const rawEvents = localStorage.getItem(`slkLocalEventQueue_${chatbotId}_${visitorId}`);

          const parsedEvents = JSON.parse(rawEvents);

          handleEvent({
            type: 'sleakInitialEvents',
            payload: {
              events: parsedEvents
            }
          });
        }

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
            // console.log('customFields:', customFields);
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

            // console.log('valid custom fields:', customFields);

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
})();
