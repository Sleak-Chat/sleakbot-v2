(async function () {
  if (!window.sleakScriptInjected) {
    window.sleakScriptInjected = true;
  } else {
    return;
  }

  const sleakbotScriptTag = document.querySelector("#sleakbot");
  const scriptCookies = sleakbotScriptTag.getAttribute("cookies");
  const scriptSrc = sleakbotScriptTag.getAttribute("src");
  const placement = sleakbotScriptTag.getAttribute("placement");
  let baseUrl;
  let widgetBaseUrl;

  const isInstance = sleakbotScriptTag.getAttribute("slk-instance");
  let instances = null;

  async function injectSleakScript(
    chatbotId,
    instanceNumber = null,
    dev,
    instancePlacement = null
  ) {
    // Use instancePlacement if provided and not empty, otherwise fall back to the placement from #sleakbot tag
    const currentPlacement =
      instancePlacement !== null && instancePlacement !== ""
        ? instancePlacement
        : placement;
    // env control
    if (scriptSrc.includes("localhost")) {
      baseUrl = "http://localhost:8001";
      widgetBaseUrl = "http://localhost:3000";
      // widgetBaseUrl = "https://widget-v2-sigma.vercel.app";
    } else if (dev === true) {
      baseUrl = "https://sleak-chat.github.io/sleakbot-v2";
      widgetBaseUrl = "https://widget-v2-sigma.vercel.app";
    } else {
      // baseUrl = "https://cdn.sleak.chat";
      // widgetBaseUrl = "https://widget.sleak.chat";

      baseUrl = "https://sleak-chat.github.io/sleakbot-v2";
      widgetBaseUrl = "https://widget-v2-sigma.vercel.app";
    }
    const fileName =
      currentPlacement === "fullwidth"
        ? "sleakbot-fw"
        : currentPlacement === "overlay"
        ? "sleakbot-ov"
        : "sleakbot";

    const sleakHtml = `${baseUrl}/${fileName}.html`;
    const sleakCss = `${baseUrl}/${fileName}.css`;

    async function appendStylesheet(url) {
      // Check if this exact stylesheet URL is already loaded to avoid duplicates
      const existingLink = Array.from(
        document.querySelectorAll('link[rel="stylesheet"]')
      ).find((link) => link.href === url || link.getAttribute("href") === url);

      if (!existingLink) {
        // Create unique CSS link ID per instance
        const cssId = instanceNumber
          ? `sleak-css-${instanceNumber}`
          : "sleak-css";
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = url;
        link.id = cssId;
        document.head.appendChild(link);
      }
    }
    appendStylesheet(sleakCss);

    // append div to body
    function appendSleakHtmlToBody(sleak_html) {
      const sleakHtml = document.createElement("div");
      sleakHtml.innerHTML = sleak_html;
      // Create unique container ID per instance
      sleakHtml.id = instanceNumber
        ? `sleak-html-${instanceNumber}`
        : "sleak-html";
      // Store instance number as data attribute for scoping queries
      if (instanceNumber) {
        sleakHtml.setAttribute("data-slk-instance", instanceNumber);
      }
      if (currentPlacement === "fullwidth") {
        sleakHtml.style.width = "100%";
        sleakHtml.style.height = "100%";
        if (instanceNumber) {
          const instanceElement = document.querySelector(
            `[slk-instance='${instanceNumber}']`
          );
          instanceElement.parentNode.insertBefore(
            sleakHtml,
            instanceElement.nextSibling
          );
        } else {
          sleakbotScriptTag.parentNode.insertBefore(
            sleakHtml,
            sleakbotScriptTag.nextSibling
          );
        }
      } else if (currentPlacement === "overlay") {
        document.body.appendChild(sleakHtml);
      } else {
        document.body.appendChild(sleakHtml);
      }
    }

    function fetchAndAppendHtml() {
      return fetch(sleakHtml)
        .then((sleak_response) => {
          return sleak_response.text();
        })
        .then((sleak_html) => {
          appendSleakHtmlToBody(sleak_html);
        });
    }

    setTimeout(function () {
      fetchAndAppendHtml()
        .then(() => {
          executeSleakbotJs(chatbotId, instanceNumber, currentPlacement);
          // console.log('sleak.chat initialized');
        })
        .catch((error) => {
          console.error("Error occurred while loading sleak.chat:", error);
        });
    }, 10);
  }

  function domReady() {
    return new Promise((resolve) => {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", resolve);
      } else {
        resolve();
      }
    });
  }

  if (isInstance) {
    domReady().then(() => {
      instances = document.querySelectorAll(`[slk-instance]`);
      // console.log("instances =", instances);

      instances.forEach((instance) => {
        const instanceNumber = instance.getAttribute("slk-instance");
        const chatbotId = instance.getAttribute("chatbot-id");
        const instancePlacement = instance.getAttribute("placement");
        const devAttr = instance.getAttribute("dev");
        const dev = devAttr ? JSON.parse(devAttr) : null;
        injectSleakScript(chatbotId, instanceNumber, dev, instancePlacement);
      });
    });
  } else {
    const chatbotId = sleakbotScriptTag.getAttribute("chatbot-id");
    const devAttr = sleakbotScriptTag.getAttribute("dev");
    const dev = devAttr ? JSON.parse(devAttr) : null;
    injectSleakScript(chatbotId, null, dev, placement);
  }

  async function executeSleakbotJs(
    chatbotId,
    instanceNumber = null,
    currentPlacement = null
  ) {
    // Use currentPlacement if provided and not empty, otherwise fall back to the placement from #sleakbot tag
    const placementToUse =
      currentPlacement !== null && currentPlacement !== ""
        ? currentPlacement
        : placement;

    // Get the container element for this specific instance to scope all queries
    let instanceContainer = null;
    if (instanceNumber) {
      instanceContainer = document.querySelector(
        `[data-slk-instance='${instanceNumber}']`
      );
    } else {
      instanceContainer = document.getElementById("sleak-html");
    }
    // Fallback to document if container not found (for backward compatibility)
    const queryScope = instanceContainer || document;

    let chatId;
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
        const encodedKey = encodeURIComponent(key) + "=";
        const cookies = document.cookie.split("; ");
        for (let c of cookies) {
          if (c.startsWith(encodedKey)) {
            return decodeURIComponent(c.substring(encodedKey.length));
          }
        }
        return null;
      }

      function deleteCookie(key, options = {}) {
        setCookie(key, "", { ...options, expires: -1 });
      }

      chatId = getCookie(`sleakChatId_${chatbotId}`);
      visitorId = getCookie(`sleakVisitorId_${chatbotId}`);

      if (chatId) {
        // console.log("cookie exists, value = ",Cookies.get(`sleakChatId_${chatbotId}`));
        // Resetting chat
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has("resetChat")) {
          deleteCookie(`sleakChatId_${chatbotId}`, { path: "/" });
          chatId = crypto.randomUUID();
          setCookie(`sleakChatId_${chatbotId}`, chatId, {
            expires: 365,
            sameSite: "None",
            secure: true,
            path: "/",
          });
          urlParams.delete("resetChat");
          const updatedParams = urlParams.toString();
          const newUrl = updatedParams
            ? `${window.location.origin}${window.location.pathname}?${updatedParams}`
            : `${window.location.origin}${window.location.pathname}`;
          window.history.replaceState(null, "", newUrl);
        }

        chatId = chatId = getCookie(`sleakChatId_${chatbotId}`);
      } else {
        chatId = crypto.randomUUID();
        setCookie(`sleakChatId_${chatbotId}`, chatId, {
          expires: 365,
          sameSite: "None",
          secure: true,
          path: "/",
        });
      }

      if (!visitorId) {
        visitorId = crypto.randomUUID();
        setCookie(`sleakVisitorId_${chatbotId}`, visitorId, {
          expires: 365,
          sameSite: "None",
          secure: true,
          path: "/",
        });
      }
    } else {
      // fallback to using localStorage
      if (localStorage.getItem(`sleakChatId_${chatbotId}`)) {
        chatId = localStorage.getItem(`sleakChatId_${chatbotId}`);
      } else {
        chatId = crypto.randomUUID();
        localStorage.setItem(`sleakChatId_${chatbotId}`, chatId);
        // console.log("new localStorage = ", chatId);
      }

      if (localStorage.getItem(`sleakVisitorId_${chatbotId}`)) {
        visitorId = localStorage.getItem(`sleakVisitorId_${chatbotId}`);
      } else {
        visitorId = crypto.randomUUID();
        localStorage.setItem(`sleakVisitorId_${chatbotId}`, visitorId);
      }
    }

    const timestamp = new Date().getTime();
    const chatbotConfigEndpoint = `${widgetBaseUrl}/api/config?id=${chatbotId}&chat_id=${chatId}&t=${timestamp}`;
    const chatbotConfigRequest = await fetch(chatbotConfigEndpoint, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const rawChatbotConfigResponse = await chatbotConfigRequest.json();
    const chatbotConfig = rawChatbotConfigResponse.data.chatbot_config;

    const widgetAppearance = chatbotConfig?.widget_appearance;

    let chatCreated = rawChatbotConfigResponse.data.chat_exists;
    let widgetOpenFlag = localStorage.getItem(`sleakWidget_${chatbotId}`);

    // main code
    if (
      chatbotConfig?.publishing?.published &&
      chatbotConfig?.publishing?.published == true
    ) {
      let sleakChime = new Audio(
        "https://cdn.sleak.chat/assets/sleak-chime.mp3"
      );
      let sleakChimeOperator = new Audio(
        "https://cdn.sleak.chat/assets/sleak-chime-operatorjoined.mp3"
      );
      let userHasInteracted = false;
      window.addEventListener("click", () => (userHasInteracted = true), {
        once: true,
      });
      window.addEventListener("keydown", () => (userHasInteracted = true), {
        once: true,
      });

      document.documentElement.style.setProperty(
        "--primary-color",
        `${chatbotConfig.primary_color}`
      );

      function playAudio(audio) {
        if (!userHasInteracted) return;
        try {
          audio.play();
        } catch (error) {
          console.error("Error playing audio:", error);
        }
      }

      let pagePath = window.location.pathname;
      let iframeWidgetbody;

      window.resetChatId = function () {
        deleteCookie(`sleakChatId_${chatbotId}`, { path: "/" });
        chatId = crypto.randomUUID();
        setCookie(`sleakChatId_${chatbotId}`, chatId, {
          expires: 365,
          sameSite: "None",
          secure: true,
          path: "/",
        });
        iframeWidgetbody.src =
          widgetBaseUrl +
          `/${chatbotId}?visitor_id=${visitorId}&chat_id=${chatId}`;
      };

      if (placementToUse == "fullwidth") {
        iframeWidgetbody = queryScope.querySelector("#sleak-widget-iframe");
        iframeWidgetbody.src =
          widgetBaseUrl +
          `/${chatbotId}?visitor_id=${visitorId}${
            widgetAppearance?.start_component === "chat"
              ? "&chat_id=" + chatId
              : ""
          }&placement=fullwidth`;
      } else {
        // Handle both default and overlay placements with shared logic
        const isOverlay = placementToUse === "overlay";

        iframeWidgetbody = queryScope.querySelector("#sleak-widget-iframe");
        iframeWidgetbody.src =
          widgetBaseUrl +
          `/${chatbotId}?visitor_id=${visitorId}${
            widgetAppearance?.start_component === "chat"
              ? "&chat_id=" + chatId
              : ""
          }${isOverlay ? `&placement=overlay` : ``}`;

        const sleakWrap = queryScope.querySelector("#sleak-widgetwrap");
        const sleakButton = queryScope.querySelector("#sleak-buttonwrap");
        var sleakPopup = queryScope.querySelector("#sleak-popup-embed");
        const sleakEmbeddedWidget =
          queryScope.querySelector("#sleak-body-embed");
        const sleakWidgetwrap = queryScope.querySelector(
          "#sleak-widget-container"
        );
        const popupListContainer = queryScope.querySelector(
          "#popup-list-container"
        );
        const liveChatPopup = queryScope.querySelector(
          "#sleak-operatorchanged-popup"
        );
        const chatInput = queryScope.querySelector(
          ".sleak-popup-chatinput-input-wrapper"
        );
        const btnPulse = queryScope.querySelector("#sleak-button-pulse");
        const isTypingIndicator = queryScope.querySelector(
          "#sleak-loader-container"
        );
        const popupListWrap = queryScope.querySelector("#popup-list-wrap");
        var sleakBtnContainer = queryScope.querySelector(
          "#sleak-btn-container"
        );
        const sleakWidgetClosedBtn = queryScope.querySelector(
          "#sleak-widget-closed"
        );
        const sleakWidgetOpenedBtn =
          queryScope.querySelector("#sleak-widget-open");
          
        const slkPopupAvatar = queryScope.querySelector(
          "#sleak-popup-embed-avatar"
        );
        const slkPopupAgentName = queryScope.querySelector(
          "#sleak-popup-embed-agentname"
        );
        const slkPopupBodyMessage = queryScope.querySelector(
          "#sleak-popup-embed-body"
        );
        const sleakMobileHandle = queryScope.querySelector(
          "#sleak-mobile-handle"
        );

        let isDragging = false;
        let startY = 0;
        let currentY = 0;
        let dragDistance = 0;

        var viewportWidth2 = window.innerWidth;

        function setStylingMobile() {
          if (isOverlay && chatInput) {
            Object.assign(chatInput.style, {
              bottom: `${chatbotConfig.btn_offset.y_mobile}px`,
            });

            if (popupListWrap) {
              Object.assign(popupListWrap.style, {
                bottom: `${chatbotConfig.btn_offset.y_mobile + 64}px`,
              });
            }
          } else {
            if (sleakButton) {
              Object.assign(sleakButton.style, {
                left: `unset`,
                right: `${chatbotConfig.btn_offset.x_mobile}px`,
                bottom: `${chatbotConfig.btn_offset.y_mobile}px`,
              });
            }

            if (popupListWrap) {
              Object.assign(popupListWrap.style, {
                right: `${chatbotConfig.btn_offset.x_mobile}px`,
                left: `unset`,
                bottom: `${chatbotConfig.btn_offset.y_mobile + 64}px`,
              });
            }
          }
        }

        function setStylingDesktop() {
          if (isOverlay && chatInput) {
            Object.assign(chatInput.style, {
              bottom: `${chatbotConfig.btn_offset.y_desktop}px`,
            });

            if (popupListWrap) {
              Object.assign(popupListWrap.style, {
                bottom: `${chatbotConfig.btn_offset.y_desktop + 64}px`,
              });
            }
          } else {
            if (sleakButton) {
              Object.assign(sleakButton.style, {
                right: `${chatbotConfig.btn_offset.x_desktop}px`,
                bottom: `${chatbotConfig.btn_offset.y_desktop}px`,
              });
            }

            if (popupListWrap) {
              Object.assign(popupListWrap.style, {
                right: `${chatbotConfig.btn_offset.x_desktop}px`,
                left: `unset`,
                bottom: `${chatbotConfig.btn_offset.y_desktop + 80}px`,
              });
            }

            if (sleakWidgetwrap) {
              sleakWidgetwrap.style.right = `${chatbotConfig.btn_offset.x_desktop}px`;
              sleakWidgetwrap.style.bottom = `${chatbotConfig.btn_offset.y_desktop}px`;
              sleakWidgetwrap.style.height = `calc(100% - 98px - (2 * ${chatbotConfig.btn_offset.y_desktop}px))`;
              sleakWidgetwrap.style.width = `calc(100% - (2 * ${chatbotConfig.btn_offset.x_desktop}px))`;
            }
          }
        }

        function setStylingMobileMirrored() {
          if (isOverlay && chatInput) {
            Object.assign(chatInput.style, {
              bottom: `${chatbotConfig.btn_offset.y_mobile}px`,
            });

            if (popupListWrap) {
              Object.assign(popupListWrap.style, {
                bottom: `${chatbotConfig.btn_offset.y_mobile + 64}px`,
              });
            }
          } else {
            if (sleakButton) {
              Object.assign(sleakButton.style, {
                right: `unset`,
                left: `${chatbotConfig.btn_offset.x_mobile}px`,
                bottom: `${chatbotConfig.btn_offset.y_mobile}px`,
              });
            }

            if (popupListWrap) {
              Object.assign(popupListWrap.style, {
                left: `${chatbotConfig.btn_offset.x_mobile}px`,
                right: `unset`,
                alignItems: `flex-start`,
                bottom: `${chatbotConfig.btn_offset.y_mobile + 80}px`,
              });
              popupListWrap.style.alignItems = "start";
            }

            if (sleakWrap) {
              sleakWrap.style.alignItems = "flex-start";
              sleakWrap.style.setProperty(
                "justify-content",
                "flex-start",
                "important"
              );
            }
          }
        }

        function setStylingDesktopMirrored() {
          if (isOverlay && chatInput) {
            Object.assign(chatInput.style, {
              bottom: `${chatbotConfig.btn_offset.y_desktop}px`,
            });

            if (popupListWrap) {
              Object.assign(popupListWrap.style, {
                bottom: `${chatbotConfig.btn_offset.y_desktop + 64}px`,
              });
            }
          } else {
            if (sleakWidgetwrap) {
              Object.assign(sleakWidgetwrap.style, {
                justifyContent: "flex-start",
                left: `${chatbotConfig.btn_offset.x_desktop}px`,
                bottom: `${chatbotConfig.btn_offset.y_desktop}px`,
              });
            }

            if (popupListWrap) {
              Object.assign(popupListWrap.style, {
                left: `${chatbotConfig.btn_offset.x_desktop}px`,
                right: `unset`,
                alignItems: `flex-start`,
                bottom: `${chatbotConfig.btn_offset.y_desktop + 80}px`,
              });
              popupListWrap.style.alignItems = "start";
            }

            if (sleakButton) {
              Object.assign(sleakButton.style, {
                right: "unset",
                left: `${chatbotConfig.btn_offset.x_desktop}px`,
                bottom: `${chatbotConfig.btn_offset.y_desktop}px`,
              });
              sleakButton.style.setProperty(
                "transform",
                "scaleX(-1)",
                "important"
              );
            }
          }
        }

        function applyResponsiveStyling() {
          viewportWidth2 = window.innerWidth;
          if (viewportWidth2 < 480) {
            if (
              !chatbotConfig.btn_offset.align_right ||
              chatbotConfig.btn_offset.align_right.mobile !== false
            ) {
              setStylingMobile();
            } else {
              setStylingMobileMirrored();
            }
          } else {
            if (
              !chatbotConfig.btn_offset.align_right ||
              chatbotConfig.btn_offset.align_right.desktop !== false
            ) {
              setStylingDesktop();
            } else {
              setStylingDesktopMirrored();
            }
          }
        }

        // Apply styling on initialization
        applyResponsiveStyling();

        // Apply styling on window resize
        window.addEventListener("resize", applyResponsiveStyling);

        // Button setup (only for non-overlay)
        if (!isOverlay && sleakBtnContainer) {
          var btnColor = chatbotConfig.primary_color;
          sleakBtnContainer.style.backgroundColor = btnColor;
          if (chatbotConfig.background_image) {
            sleakBtnContainer.style.backgroundImage = `url("${chatbotConfig.background_image}")`;
            if (sleakWidgetOpenedBtn) sleakWidgetOpenedBtn.remove();
            if (sleakWidgetClosedBtn) sleakWidgetClosedBtn.remove();
          }

          function slkShowBtn() {
            if (sleakButton) {
              sleakButton.style.display = "flex";
              sleakButton.style.opacity = "0";
              sleakButton.style.transform = "scale(0.8)";
              setTimeout(function () {
                sleakButton.style.opacity = "1";
                sleakButton.style.transform = "scale(1)";
              }, 500);
            }
          }
          slkShowBtn();
        } else if (isOverlay && chatInput) {
          // For overlay, show the chat input instead
          function slkShowInput() {
            chatInput.style.display = "flex";
            chatInput.style.opacity = "0";
            chatInput.style.transform = "scale(0.8)";
            setTimeout(function () {
              chatInput.style.opacity = "1";
              chatInput.style.transform = "scale(1)";
            }, 500);
          }
          slkShowInput();
        }

        let slkBodyRendered = false;
        function slkRenderWidgetBody(callback) {
          iframeWidgetbody.src =
            widgetBaseUrl +
            `/${chatbotId}?visitor_id=${visitorId}${
              widgetAppearance?.start_component === "chat"
                ? "&chat_id=" + chatId
                : ""
            }${isOverlay ? `&placement=overlay` : ``}`;

          iframeWidgetbody.addEventListener(
            "load",
            () => callback && callback(),
            { once: true }
          );
        }
        if (chatCreated || widgetOpenFlag) {
          // console.log('chat created or widget already opened, rendering widget');
          slkRenderWidgetBody();
          slkBodyRendered = true;
        }

        window.sleakWidgetOpenState = false;
        window.sleakWidgetFullScreen = false;
        let firstButtonClick = true;

        // widget preview
        if (window.location.href.includes("preview.sleak.chat/")) {
          if (!slkBodyRendered) {
            slkRenderWidgetBody();
            slkBodyRendered = true;
          }
          if (window.innerWidth > 480) {
            setTimeout(() => {
              if (window.sleakWidgetOpenState == false)
                window.toggleSleakWidget();
            }, 2000);
          }
        }

        window.populatePopup = function (avatar, name, message) {
          if (slkPopupAvatar && slkPopupAgentName && slkPopupBodyMessage) {
            slkPopupAvatar.src = avatar;
            slkPopupAgentName.textContent = name;
            slkPopupBodyMessage.textContent = message;
          }
        };

        // Function to create a new popup element
        function createNewPopup(avatar, name, message) {
          if (!sleakPopup) return null;

          // Clone the existing popup
          const newPopup = sleakPopup.cloneNode(true);
          
          // Generate unique IDs for the new popup elements
          const timestamp = Date.now();
          const newPopupId = `sleak-popup-embed-${timestamp}`;
          // Remove the old ID and set a new unique ID
          newPopup.removeAttribute("id");
          newPopup.id = newPopupId;
          
          // Update IDs for child elements
          const newAvatar = newPopup.querySelector("#sleak-popup-embed-avatar");
          const newAgentName = newPopup.querySelector("#sleak-popup-embed-agentname");
          const newBodyMessage = newPopup.querySelector("#sleak-popup-embed-body");
          const newCloseBtn = newPopup.querySelector("#sleak-popup-embed-closebtn-icon");
          
          if (newAvatar) {
            newAvatar.removeAttribute("id");
            newAvatar.id = `sleak-popup-embed-avatar-${timestamp}`;
            newAvatar.src = avatar;
          }
          if (newAgentName) {
            newAgentName.removeAttribute("id");
            newAgentName.id = `sleak-popup-embed-agentname-${timestamp}`;
            newAgentName.textContent = name;
          }
          if (newBodyMessage) {
            newBodyMessage.removeAttribute("id");
            newBodyMessage.id = `sleak-popup-embed-body-${timestamp}`;
            newBodyMessage.textContent = message;
          }
          if (newCloseBtn) {
            newCloseBtn.removeAttribute("id");
            newCloseBtn.id = `sleak-popup-embed-closebtn-icon-${timestamp}`;
          }

          // Set up close button event listener for the new popup
          const closePopupBtn = newPopup.querySelector("[close-popup]");
          if (closePopupBtn) {
            closePopupBtn.addEventListener("click", function (event) {
              event.stopPropagation();
              Object.assign(newPopup.style, {
                transform: "translateY(12px)",
                opacity: "0",
              });

              // Wait for animation to complete before removing
              setTimeout(() => {
                newPopup.remove();
              }, 400);
            });
          }

          newPopup.addEventListener("click", function () {
            window.toggleSleakWidget();
          });

          // Find the last popup element (in case there are multiple)
          const allPopups = queryScope.querySelectorAll(".sleak-popup-embed");
          const lastPopup = allPopups.length > 0 ? allPopups[allPopups.length - 1] : sleakPopup;
          
          // Insert the new popup after the last existing popup
          lastPopup.parentNode.insertBefore(newPopup, lastPopup.nextSibling);

          // Show the new popup with animation
          newPopup.style.display = "flex";
          newPopup.style.opacity = "0";
          newPopup.style.transform = "translateY(20px)";
          newPopup.style.transition = "opacity 0.5s ease, transform 0.5s ease";
          setTimeout(function () {
            newPopup.style.opacity = "1";
            newPopup.style.transform = "translateY(0)";
          }, 50);

          newPopup.setAttribute("open-widget", "")

          return newPopup;
        }

        // Set initial popup content (only if popup elements exist)
        if (slkPopupAvatar && slkPopupAgentName && slkPopupBodyMessage) {
          window.populatePopup(
            chatbotConfig.avatar_url,
            chatbotConfig.name,
            chatbotConfig.first_message
          );
        }

        function openSleakWidget() {
          // Reset drag state
          isDragging = false;
          dragDistance = 0;
          if (sleakWidgetwrap) {
            sleakWidgetwrap.style.transform = `unset`;
          }

          sleakEmbeddedWidget.style.display = "flex";
          iframeWidgetbody.style.pointerEvents = "auto";

          // Hide all popups with transition animation
          const allPopups = queryScope.querySelectorAll(".sleak-popup-embed");
          allPopups.forEach((popup) => {
            Object.assign(popup.style, {
              transform: "translateY(12px)",
              opacity: "0",
            });
          });
          // Wait for animation to complete before hiding
          setTimeout(() => {
            allPopups.forEach((popup) => {
              if (popup.id !== "sleak-popup-embed"){
                popup.remove();
              } else {
                popup.style.display = "none";
              }
            });
          }, 300);

          // Animate chatInput out for overlay placement
          if (chatInput) {
            if (isOverlay) {
              chatInput.style.transition =
                "opacity 0.3s ease, transform 0.3s ease";
              chatInput.style.opacity = "0";
              chatInput.style.transform = "scale(0.8)";
              setTimeout(() => {
                chatInput.style.display = "none";
              }, 300);
            } else {
              chatInput.style.display = "none";
            }
          }

          if (liveChatPopup) liveChatPopup.style.display = "none";
          if (btnPulse) btnPulse.style.display = "none";
          if (isTypingIndicator) isTypingIndicator.style.display = "none";

          // Animate in - start from hidden state
          sleakEmbeddedWidget.style.display = "flex";
          sleakEmbeddedWidget.style.opacity = "0";
          sleakEmbeddedWidget.style.transform = "translateY(12px)";

          // Force reflow to ensure initial state is applied
          void sleakEmbeddedWidget.offsetWidth;

          // Animate to visible state
          setTimeout(() => {
            sleakEmbeddedWidget.classList.add("open");
            sleakEmbeddedWidget.style.opacity = "1";
            sleakEmbeddedWidget.style.transform = "translateY(0)";
          }, 10);
        }

        window.closeSleakWidget = function () {
          sleakEmbeddedWidget.classList.remove("open");
          iframeWidgetbody.classList.remove("open");
          iframeWidgetbody.style.pointerEvents = "";
          sleakEmbeddedWidget.style.opacity = "0";
          sleakEmbeddedWidget.style.transform = "translateY(12px)";

          if (isOverlay && chatInput) {
            // For overlay, just hide the widget
            setTimeout(() => {
              sleakEmbeddedWidget.style.display = "none";
              // Show the input again when widget closes with animation
              if (chatInput && isOverlay) {
                chatInput.style.display = "flex";
                chatInput.style.transition =
                  "opacity 0.3s ease, transform 0.3s ease";
                chatInput.style.opacity = "0";
                chatInput.style.transform = "scale(0.8)";
                // Force reflow
                void chatInput.offsetWidth;
                // Animate in
                setTimeout(() => {
                  chatInput.style.opacity = "1";
                  chatInput.style.transform = "scale(1)";
                }, 10);
              } else if (chatInput) {
                chatInput.style.display = "flex";
              }
            }, 300);
          }

          if (
            window.sleakWidgetOpenState &&
            sleakWidgetOpenedBtn &&
            sleakWidgetClosedBtn
          ) {
            sleakWidgetOpenedBtn.classList.add("image-hide");
            sleakWidgetOpenedBtn.style.animation = "none";
            void sleakWidgetOpenedBtn.offsetWidth;
            sleakWidgetOpenedBtn.style.animation = "";

            // Wait for animation to complete, then hide
            setTimeout(() => {
              sleakWidgetOpenedBtn.style.display = "none";
              sleakWidgetOpenedBtn.classList.remove("image-hide");
            }, 300);

            setTimeout(() => {
              // Show and animate closed button in
              sleakWidgetClosedBtn.style.display = "flex";
              sleakWidgetClosedBtn.style.animation = "none";
              void sleakWidgetClosedBtn.offsetWidth;
              sleakWidgetClosedBtn.style.animation = "";
            }, 150);
          }

          window.sleakWidgetOpenState = false;
        };

        window.toggleFullScreen = async function (expanded = false) {
          if (isOverlay || !sleakButton) return; // Full screen not applicable for overlay

          if (expanded === true) {
            sleakButton.classList.add("full-chat-widget");
            if (sleakWidgetwrap) {
              sleakWidgetwrap.style.height = `calc(100% - (2 * ${chatbotConfig.btn_offset.y_desktop}px))`;
            }

            sleakEmbeddedWidget.style.maxWidth = `720px`;
            sleakEmbeddedWidget.style.maxHeight = `calc(${document.body.clientHeight}px - (2 * ${chatbotConfig.btn_offset.y_desktop}px))`;
            sleakEmbeddedWidget.style.bottom = `0`;

            window.sleakWidgetFullScreen = true;
          } else {
            if (sleakWidgetwrap) {
              sleakWidgetwrap.style.height = `calc(100% - 98px - (2 * ${chatbotConfig.btn_offset.y_desktop}px))`;
            }
            sleakEmbeddedWidget.style.maxWidth = ``;
            sleakEmbeddedWidget.style.maxHeight = ``;
            sleakEmbeddedWidget.style.height = ``;
            sleakEmbeddedWidget.style.bottom = ``;

            setTimeout(() => {
              sleakButton.classList.remove("full-chat-widget");
            }, 150);

            window.sleakWidgetFullScreen = false;
          }
        };

        window.toggleSleakWidget = async function () {
          // check if widget is open
          if (window.sleakWidgetOpenState == false) {
            if (sleakWidgetClosedBtn && sleakWidgetOpenedBtn) {
              sleakWidgetClosedBtn.classList.add("image-hide");
              sleakWidgetClosedBtn.style.animation = "none";
              // Force reflow to restart animation
              void sleakWidgetClosedBtn.offsetWidth;
              sleakWidgetClosedBtn.style.animation = "";

              // Wait for animation to complete, then hide
              setTimeout(() => {
                sleakWidgetClosedBtn.style.display = "none";
                sleakWidgetClosedBtn.classList.remove("image-hide");
              }, 300);

              setTimeout(() => {
                // Show and animate open button in
                sleakWidgetOpenedBtn.style.display = "flex";
                sleakWidgetOpenedBtn.style.animation = "none";
                void sleakWidgetOpenedBtn.offsetWidth;
                sleakWidgetOpenedBtn.style.animation = "";
              }, 150);
            }

            if (firstButtonClick && !slkBodyRendered) {
              slkRenderWidgetBody(() => {
                window.sleakWidgetOpenState = true;
                openSleakWidget();
              });
            } else {
              window.sleakWidgetOpenState = true;
              openSleakWidget();
            }

            if (window.matchMedia("(max-width: 768px)").matches) {
              document.body.style.overflow = "hidden";
            }

            /// check for first button click of page load
            if (firstButtonClick) {
              if (!widgetOpenFlag) {
                // for hiding popup after widget open
                widgetOpenFlag = true;
                localStorage.setItem(
                  `sleakWidget_${chatbotId}`,
                  crypto.randomUUID()
                );
              }

              if (firstButtonClick) firstButtonClick = false;
            }
          } else if (window.sleakWidgetOpenState == true) {
            window.closeSleakWidget();

            if (window.matchMedia("(max-width: 768px)").matches) {
              document.body.style.overflow = "hidden";
            }
          }
        };

        (async function btnClickEventHandling() {
          queryScope.querySelectorAll("[open-widget]").forEach((btn) => {
            btn.addEventListener("click", function () {
              window.toggleSleakWidget();
            });
          });

          const closePopupBtn = queryScope.querySelector("[close-popup]");
          if (closePopupBtn) {
            closePopupBtn.addEventListener("click", function (event) {
              event.stopPropagation();
              if (sleakPopup) {
                Object.assign(sleakPopup.style, {
                  transform: "translateY(12px)",
                  opacity: "0",
                });
                Object.assign(liveChatPopup.style, {
                  transform: "translateY(12px)",
                  opacity: "0",
                });

                // Wait for animation to complete before hiding
                setTimeout(() => {
                  sleakPopup.style.display = "none";
                  liveChatPopup.style.display = "none";
                }, 400);
              }
            });
          }
        })();

        // event listener for scrolling
        if (window.matchMedia("(max-width: 768px)").matches) {
          window.addEventListener("scroll", function () {
            if (window.sleakWidgetOpenState == true) {
              const viewportHeightScroll = window.innerHeight;
              const widgetWrap = queryScope.querySelector("#sleak-widgetwrap");
              if (widgetWrap) {
                widgetWrap.style.height = viewportHeightScroll + "px";
                widgetWrap.style.minHeight = viewportHeightScroll + "px";
              }
            }
          });
        }

        // disable popup/chime after first page load
        var sessionStorageKey = chatbotId + "_sleakPopupTriggered";
        var hasPopupBeenTriggered = sessionStorage.getItem(sessionStorageKey);
        // var hasPopupBeenTriggered = false; // remove line in prod

        let blockDefaultPopup = false;
        var sessionStorageTriggerBased =
          chatbotId + "_sleakTriggerbasedPopupTriggered";

        function showPopup() {
          if (!sleakPopup) return;
          isTypingIndicator.style.display = "none";
          sleakPopup.style.display = "flex";
          sleakPopup.style.opacity = "0";
          sleakPopup.style.transform = "translateY(12px)";
          sleakPopup.style.transition =
            "opacity 0.5s ease, transform 0.5s ease";
          setTimeout(function () {
            sleakPopup.style.opacity = "1";
            sleakPopup.style.transform = "translateY(0)";
          }, 50);
          sessionStorage.setItem(sessionStorageKey, "true");
        }

        const popupRules = chatbotConfig.popups?.rules || [];

        let pagePopup;
        if (popupRules.length > 0) {
          pagePopup = popupRules.find((rule) => rule.page == pagePath);
          if (pagePopup) {
            slkRenderWidgetBody();
            slkBodyRendered = true;
            blockDefaultPopup = true;
          }
        }

        window.showOperatorPopup = function (payload) {
          if (liveChatPopup) {
            const avatarEl = liveChatPopup.querySelector(
              "#sleak-operatorchanged-avatar"
            );
            const nameEl = liveChatPopup.querySelector(
              "#sleak-operatorchanged-name"
            );
            if (avatarEl) avatarEl.src = payload.avatar;
            if (nameEl) nameEl.innerText = payload.name;

            if (!window.sleakWidgetOpenState) {
              liveChatPopup.style.transition =
                "opacity 0.2s ease, transform 0.2s ease";
              liveChatPopup.style.transform = "translateY(12px)";
              liveChatPopup.style.opacity = "0";
              liveChatPopup.style.display = "flex";
              setTimeout(function () {
                liveChatPopup.style.opacity = "1";
                liveChatPopup.style.transform = "translateY(0)";
              }, 50);
              if (isTypingIndicator) {
                setTimeout(
                  () => (isTypingIndicator.style.display = "flex"),
                  1000
                );
              }

              playAudio(sleakChimeOperator);
            }
            if (isTypingIndicator) {
              setTimeout(
                () => (isTypingIndicator.style.display = "none"),
                6000
              );
            }
          }
        };

        window.showTriggerBasedPopup = async function (payload) {
          // console.log('showing livechat popup with payload = ', payload);

          window.populatePopup(payload.avatar, payload.name, pagePopup.message);

          window.showOperatorPopup(payload);

          setTimeout(function () {
            blockDefaultPopup = false;
            if (!chatCreated) {
              if (!window.sleakWidgetOpenState) {
                showPopup();
                playAudio(sleakChime);
              }
            }
            setTimeout(function () {
              if (!window.sleakWidgetOpenState && chatInput) {
                chatInput.style.transition =
                  "opacity 0.2s ease, transform 0.2s ease";
                chatInput.style.transform = "translateY(20px)";
                chatInput.style.opacity = "0";
                chatInput.style.display = "flex";
                setTimeout(function () {
                  chatInput.style.opacity = "1";
                  chatInput.style.transform = "translateY(0)";
                }, 50);

                if (btnPulse) {
                  btnPulse.style.display = "flex";
                  btnPulse.style.opacity = "1";
                  btnPulse.style.transform = "scale(1)";
                }
              }
            }, 500);
          }, 7000);
        };

        if (!hasPopupBeenTriggered && !blockDefaultPopup) {
          const viewportWidth = window.innerWidth;

          if (viewportWidth < 480) {
            if (chatbotConfig.popup.mobile == true) {
              setTimeout(function () {
                if (window.sleakWidgetOpenState == false) {
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
                if (window.sleakWidgetOpenState == false) {
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
                type: "prefillMessage",
                payload: { message },
              },
              "*"
            );
            if (!window.sleakWidgetOpenState) {
              window.toggleSleakWidget();
            }
          };
          queryScope.querySelectorAll("[slk-prefill-form]").forEach((form) => {
            form.addEventListener("submit", async function (e) {
              e.preventDefault();
              if (!slkBodyRendered) {
                await slkRenderWidgetBody();
                slkBodyRendered = true;
              }
              setTimeout(() => {
                const message = form.querySelector(
                  "[slk-prefill-message]"
                ).value;
                window.sendMessageToSleakbot(message);
                // clear the form
                form.reset();
              }, 200);
            });
          });
        })();

        function handleDragStart(e) {
          if (!window.sleakWidgetOpenState) return;
          isDragging = true;
          const touch = e.touches ? e.touches[0] : e;
          startY = touch.clientY;
          if (sleakMobileHandle) {
            sleakMobileHandle.style.cursor = "grabbing";
          }
        }

        function handleDragMove(e) {
          if (!isDragging || !window.sleakWidgetOpenState) return;
          if (e.cancelable) {
            e.preventDefault();
          }
          const touch = e.touches ? e.touches[0] : e;
          currentY = touch.clientY;
          dragDistance = currentY - startY;

          // Only allow dragging down (positive values)
          if (dragDistance > 0) {
            sleakWidgetwrap.style.transform = `translateY(${dragDistance}px)`;
          }
        }

        function handleDragEnd(e) {
          if (!isDragging || !window.sleakWidgetOpenState) return;
          isDragging = false;

          if (dragDistance > 100) {
            // Close widget if dragged more than 100px
            window.closeSleakWidget();

            if (window.matchMedia("(max-width: 768px)").matches) {
              document.body.style.overflow = "auto";
            }
          } else {
            // Reset position if dragged less than 100px
            sleakWidgetwrap.style.transform = "translateY(0)";
          }

          dragDistance = 0;
        }

        if (sleakMobileHandle) {
          // Ensure mobile handle has pointer events enabled
          sleakMobileHandle.style.pointerEvents = "auto";

          // Touch events for mobile
          sleakMobileHandle.addEventListener("touchstart", handleDragStart, {
            passive: false,
          });
          sleakMobileHandle.addEventListener("touchmove", handleDragMove, {
            passive: false,
          });
          sleakMobileHandle.addEventListener("touchend", handleDragEnd);

          sleakMobileHandle.addEventListener("click", () =>
            window.closeSleakWidget()
          );
        }
      }

      document.addEventListener("visibilitychange", function () {
        const visibilityState = document.visibilityState;
        // console.log('Visibility changed:', visibilityState);

        if (iframeWidgetbody && iframeWidgetbody.contentWindow) {
          // console.log('Sending visibility change to iframe:', visibilityState);
          iframeWidgetbody.contentWindow.postMessage(
            {
              type: "visibilityChange",
              payload: {
                state: visibilityState,
              },
            },
            "*"
          );
        } else {
          // console.log('Widget iframe not available to send visibility change');
        }
      });

      if (scriptSrc.includes("dev")) {
        ["log", "warn", "error"].forEach((type) => {
          const orig = console[type];
          console[type] = (...args) => {
            orig(...args);
            fetch(
              "https://xvqjuiyrmzkhsfosfozs.supabase.co/rest/v1/consolelogs",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  apikey:
                    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2cWp1aXlybXpraHNmb3Nmb3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkzMDgyNDQsImV4cCI6MjAzNDg4NDI0NH0.l4EDmKGcSXAolPPAfjL4X1X9T6cxIO0bg9s6oAbu_3E",
                },
                body: JSON.stringify({
                  type,
                  message: args.map((a) => String(a)).join(" "),
                  timestamp: new Date().toISOString(),
                  chat_id: chatId,
                  chatbot_id: chatbotId,
                  window: "parent",
                }),
              }
            );
          };
        });
      }

      // child window event handling
      async function pushGtmEvent() {
        var dataLayer = window.dataLayer || (window.dataLayer = []);
        dataLayer.push({
          event: event.data,
          postMessageData: event,
        });
        // console.log('Pushed to dataLayer:', event);
      }

      // if (slkInstance) return;

      window.addEventListener("message", (event) => {
        if (
          event.origin === "https://widget-v2-sigma.vercel.app" ||
          event.origin === "https://widget.sleak.chat" ||
          event.origin === "http://localhost:3000"
        ) {
          // console.log("Received message:", event);

          if (
            event.data.type === "closePopup" ||
            event.data.type === "toggleChat"
          ) {
            window.toggleSleakWidget();
          } else if (event.data.type === "operatorChanged") {
            playAudio(sleakChimeOperator);
            window.showOperatorPopup(event.data.payload);
          } else if (event.data.type === "domInitialized") {
            const sleakPageLoad = {
              type: "sleakPageLoad",
              payload: {
                currentPath: pagePath,
                fullUrl: window.location.href,
              },
            };
            iframeWidgetbody.contentWindow.postMessage(sleakPageLoad, "*");
            eventHandling();
          } else if (event.data.type === "sleakChatInitiated") {
            pushGtmEvent(event);
          } else if (event.data.type === "sleakSentContactDetails") {
            pushGtmEvent(event);
          } else if (event.data.type === "sleakHumanHandoffActivated") {
            pushGtmEvent(event);
          } else if (event.data.type === "chatCreated") {
            localStorage.setItem(
              `slkChatCreated_${chatbotId}_${chatId}`,
              "true"
            );
            localStorage.removeItem(
              `slkLocalEventQueue_${chatbotId}_${chatId}`
            );
            chatCreated = true;
            // console.log('created chat localstorage ');
          } else if (event.data.type === "initiateTriggerBasedPopup") {
            // console.log('trigger initiateTriggerBasedPopup = ', event);
            window.showTriggerBasedPopup(event.data.payload);
          } else if (event.data.type === "resetChat") {
            chatId = event.data.chatId;
            deleteCookie(`sleakChatId_${chatbotId}`, { path: "/" });
            setCookie(`sleakChatId_${chatbotId}`, chatId, {
              expires: 365,
              sameSite: "None",
              secure: true,
              path: "/",
            });
          } else if (event.data.type === "showMessagePopup") {
            // Check if there's already a visible popup (check all popups, not just the first one)
            const allPopups = queryScope.querySelectorAll(".sleak-popup-embed");
            let existingPopupVisible = false;
            
            for (let i = 0; i < allPopups.length; i++) {
              const popup = allPopups[i];
              const computedStyle = window.getComputedStyle(popup);
              if (computedStyle.display === "flex" || popup.style.display === "flex") {
                existingPopupVisible = true;
                break;
              }
            }
            
            if (existingPopupVisible) {
              // Create a new popup underneath the existing one(s)
              createNewPopup(
                event.data.payload.avatar,
                event.data.payload.name,
                event.data.payload.message
              );
            } else {
              // No existing popup, use the original behavior
              window.populatePopup(
                event.data.payload.avatar,
                event.data.payload.name,
                event.data.payload.message
              );
              if (!window.sleakWidgetOpenState) showPopup();
            }
            playAudio(sleakChime);
          } else if (event.data.type === "sleakChatClosed") {
            deleteCookie(`sleakChatId_${chatbotId}`, { path: "/" });

            iframeWidgetbody.src =
              widgetBaseUrl + `/${chatbotId}?visitor_id=${visitorId}`;
          } else if (event.data.type === "sleakChatOpened") {
            chatId = event.data.chatId;
            setCookie(`sleakChatId_${chatbotId}`, chatId, {
              expires: 365,
              sameSite: "None",
              secure: true,
              path: "/",
            });
          } else if (event.data.type === "toggleFullScreen") {
            window.toggleFullScreen(event.data.expanded);
          } else if (event.data.type === "closeActiveChat") {
            deleteCookie(`sleakChatId_${chatbotId}`, { path: "/" });
          } else {
            if (event.data.type !== "showOutputLogsAdmin")
              console.log(event.data);
          }
        }
      });

      // Keyboard shortcut for toggling fullscreen (Command+E on Mac, Control+E on Windows)
      window.addEventListener("keydown", function (event) {
        const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
        const modifierKey = isMac ? event.metaKey : event.ctrlKey;

        if (modifierKey && event.key.toLowerCase() === "e") {
          event.preventDefault();
          if (iframeWidgetbody && iframeWidgetbody.contentWindow) {
            window.sleakWidgetFullScreen = !window.sleakWidgetFullScreen;
            window.toggleFullScreen(window.sleakWidgetFullScreen);
            iframeWidgetbody.contentWindow.postMessage(
              {
                type: "toggleFullScreen",
                expanded: window.sleakWidgetFullScreen,
              },
              "*"
            );
          }
        }
      });

      function eventHandling() {
        if (!chatCreated) {
          if (
            !localStorage.getItem(`slkLocalEventQueue_${chatbotId}_${chatId}`)
          ) {
            localStorage.setItem(
              `slkLocalEventQueue_${chatbotId}_${chatId}`,
              JSON.stringify([])
            );
            // console.log('created slkLocalEventQueue localstorage');
          }
        }

        function handleEvent(event) {
          // console.log('Captured Event:', event);

          if (!chatCreated && event.type == "sleakNewEvent") {
            const cookieKey = `slkLocalEventQueue_${chatbotId}_${chatId}`;

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
            iframeWidgetbody.contentWindow.postMessage(event, "*");
          }
        }

        async function interceptGlobalEvents() {
          const eventGroups = {
            form_submission: ["submit", "formSubmit"],
            purchase: [
              "purchase",
              "orderComplete",
              "orderPlaced",
              "order_complete",
              "order_placed",
            ],
            add_to_cart: ["addToCart", "add_to_cart"],
            login: ["logIn", "log_in", "login"],
            sign_up: ["signUp", "signup", "sign_up"],
          };

          function extractEventConfig(event) {
            const eventConfig = {};

            // For form submissions, extract the target element details
            if (event.type === "submit" || event.type === "formSubmit") {
              eventConfig.formName = event.target
                ? event.target.name || event.target.id || null
                : null;
            }

            // For e-commerce-related events, extract order details if available
            if (
              [
                "purchase",
                "orderComplete",
                "orderPlaced",
                "order_complete",
                "order_placed",
              ].includes(event.type)
            ) {
              // Check if event has a `detail` property containing order info
              if (event.detail) {
                eventConfig = event.detail || {};
              }
            }

            return eventConfig;
          }

          // Loop through groups and set eventlisteners
          Object.entries(eventGroups).forEach(([group, events]) => {
            events.forEach((event) => {
              document.addEventListener(event, function (eventDetails) {
                handleEvent({
                  type: "sleakNewEvent",
                  payload: {
                    timestamp: new Date().toISOString(),
                    type: "web_event",
                    event_group: group,
                    event: eventDetails.type,
                    event_config: extractEventConfig(eventDetails),
                  },
                });
              });
            });
          });
        }

        interceptGlobalEvents();

        async function currentUrlEvent() {
          const eventPayload = {
            type: "sleakNewEvent",
            payload: {
              timestamp: new Date().toISOString(),
              type: "web_event",
              event_group: "page_view",
              event: "DOMContentLoaded",
              event_config: {
                url: window.location.href,
              },
            },
          };
          // console.log('currentUrlEvent full payload:', JSON.stringify(eventPayload, null, 2));
          handleEvent(eventPayload);
        }
        currentUrlEvent();

        if (!chatCreated) {
          // local event queue for if chat does not exist
          const rawEvents = localStorage.getItem(
            `slkLocalEventQueue_${chatbotId}_${chatId}`
          );

          const parsedEvents = JSON.parse(rawEvents);

          handleEvent({
            type: "sleakInitialEvents",
            payload: {
              events: parsedEvents,
            },
          });
        }

        // custom fields
        function customFields() {
          const customFieldsConfig = chatbotConfig.custom_fields_config;

          // end user will push custom fields in an object to this function
          window.sleakPushCustomFields = function (customFields) {
            // validate if the object is valid
            if (!customFields || typeof customFields !== "object") {
              console.error("invalid type. object expected.");
              return;
            }
            // validate if object is not empty, and keys exist in config
            const validKeys = Object.keys(customFields).filter((key) =>
              customFieldsConfig.map((cf) => cf.key).includes(key)
            );
            const invalidKeys = Object.keys(customFields).filter(
              (key) => !customFieldsConfig.map((cf) => cf.key).includes(key)
            );

            if (invalidKeys.length > 0) {
              console.error(`invalid custom fields: ${invalidKeys.join(", ")}`);
              return;
            }
            if (validKeys.length === 0) {
              console.error("no valid custom fields to push");
              return;
            }
            // validate if there are empty values
            const emptyValues = validKeys.filter(
              (key) => customFields[key] === ""
            );
            if (emptyValues.length > 0) {
              console.error(
                `empty custom field values: ${emptyValues.join(", ")}`
              );
              return;
            }

            // console.log('valid custom fields:', customFields);

            // push the valid custom fields
            handleEvent({
              type: "updateCustomFields",
              payload: {
                timestamp: new Date().toISOString(),
                customFields: customFields,
              },
            });
          };

          // dispatch event when custom fields can be updated
          window.dispatchEvent(
            new CustomEvent("sleakCustomFieldsHandlerInitialized")
          );
        }

        // console.log('chatbotConfig', chatbotConfig);
        if (chatbotConfig.custom_fields_config) customFields();

        function sendWidth() {
          handleEvent({ type: "sleakWidthResize", width: window.innerWidth });
        }

        window.addEventListener("resize", sendWidth);
        sendWidth();
      }
    }
  }
})();
