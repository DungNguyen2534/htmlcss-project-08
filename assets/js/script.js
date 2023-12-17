// Code price slider
document.addEventListener("DOMContentLoaded", function () {
  const slider = document.querySelector(".filter__form-slider");
  const minInput = document.querySelector(".min-input");
  const maxInput = document.querySelector(".max-input");

  const handleThickness = 22;
  const minDistanceBetweenHandles = 8;
  let isDragging = false;
  let activeHandle = null;

  const handleDrag = (event) => {
    if (isDragging && activeHandle !== null) {
      event.preventDefault();

      const sliderRect = slider.getBoundingClientRect();
      const clientX = event.type.startsWith("touch") ? event.touches[0].clientX : event.clientX;
      const mouseX = clientX - sliderRect.left;
      let percentage = (mouseX / sliderRect.width) * 100;

      percentage = Math.max(0, Math.min(100, percentage));

      const minValue = parseFloat(getComputedStyle(slider).getPropertyValue("--min-value"));
      const maxValue = parseFloat(getComputedStyle(slider).getPropertyValue("--max-value"));

      const handleDistance = Math.abs(maxValue - minValue);

      if (activeHandle === "min" && percentage + minDistanceBetweenHandles >= maxValue) {
        slider.style.setProperty("--min-value", `${maxValue - minDistanceBetweenHandles}%`);
      } else if (activeHandle === "max" && percentage - minDistanceBetweenHandles <= minValue) {
        slider.style.setProperty("--max-value", `${minValue + minDistanceBetweenHandles}%`);
      } else {
        slider.style.setProperty(`--${activeHandle}-value`, `${percentage}%`);
      }

      updateInputs();
    }
  };

  const updateInputs = () => {
    const currentMinValue = parseFloat(getComputedStyle(slider).getPropertyValue("--min-value"));
    const currentMaxValue = parseFloat(getComputedStyle(slider).getPropertyValue("--max-value"));
    const range = currentMaxValue - currentMinValue;

    const minValueActual = (currentMinValue / 100) * 160;
    const maxValueActual = (currentMaxValue / 100) * 160;

    minInput.value = `$${minValueActual.toFixed(2)}`;
    maxInput.value = `$${maxValueActual.toFixed(2)}`;
  };

  const handleStart = (event) => {
    isDragging = true;
    const sliderRect = slider.getBoundingClientRect();
    const clientX = event.type.startsWith("touch") ? event.touches[0].clientX : event.clientX;
    const mouseX = clientX - sliderRect.left;
    let percentage = (mouseX / sliderRect.width) * 100;

    const distanceToMin = Math.abs(percentage - parseFloat(getComputedStyle(slider).getPropertyValue("--min-value")));
    const distanceToMax = Math.abs(percentage - parseFloat(getComputedStyle(slider).getPropertyValue("--max-value")));

    if (distanceToMin < distanceToMax) {
      activeHandle = "min";
    } else {
      activeHandle = "max";
    }

    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("touchmove", handleDrag, { passive: false });
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchend", handleEnd);
  };

  const handleEnd = () => {
    isDragging = false;
    activeHandle = null;
    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("touchmove", handleDrag);
    document.removeEventListener("mouseup", handleEnd);
    document.removeEventListener("touchend", handleEnd);
  };

  slider.addEventListener("mousedown", handleStart);
  slider.addEventListener("touchstart", handleStart);
});

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

/**
 * Hàm tải template
 *
 * Cách dùng:
 * <div id="parent"></div>
 * <script>
 *  load("#parent", "./path-to-template.html");
 * </script>
 */
function load(selector, path) {
  const cached = localStorage.getItem(path);
  if (cached) {
    $(selector).innerHTML = cached;
  }

  fetch(path)
    .then((res) => res.text())
    .then((html) => {
      if (html !== cached) {
        $(selector).innerHTML = html;
        localStorage.setItem(path, html);
      }
    })
    .finally(() => {
      window.dispatchEvent(new Event("template-loaded"));
    });
}

/**
 * Hàm kiểm tra một phần tử
 * có bị ẩn bởi display: none không
 */
function isHidden(element) {
  if (!element) return true;

  if (window.getComputedStyle(element).display === "none") {
    return true;
  }

  let parent = element.parentElement;
  while (parent) {
    if (window.getComputedStyle(parent).display === "none") {
      return true;
    }
    parent = parent.parentElement;
  }

  return false;
}

/**
 * Hàm buộc một hành động phải đợi
 * sau một khoảng thời gian mới được thực thi
 */
function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

/**
 * Hàm tính toán vị trí arrow cho dropdown
 *
 * Cách dùng:
 * 1. Thêm class "js-dropdown-list" vào thẻ ul cấp 1
 * 2. CSS "left" cho arrow qua biến "--arrow-left-pos"
 */
const calArrowPos = debounce(() => {
  if (isHidden($(".js-dropdown-list"))) return;

  const items = $$(".js-dropdown-list > li");

  items.forEach((item) => {
    const arrowPos = item.offsetLeft + item.offsetWidth / 2;
    item.style.setProperty("--arrow-left-pos", `${arrowPos}px`);
  });
});

// Tính toán lại vị trí arrow khi resize trình duyệt
window.addEventListener("resize", calArrowPos);

// Tính toán lại vị trí arrow sau khi tải template
window.addEventListener("template-loaded", calArrowPos);

/**
 * Giữ active menu khi hover
 *
 * Cách dùng:
 * 1. Thêm class "js-menu-list" vào thẻ ul menu chính
 * 2. Thêm class "js-dropdown" vào class "dropdown" hiện tại
 *  nếu muốn reset lại item active khi ẩn menu
 */
window.addEventListener("template-loaded", handleActiveMenu);

function handleActiveMenu() {
  const dropdowns = $$(".js-dropdown");
  const menus = $$(".js-menu-list");
  const activeClass = "menu-column__item--active";

  const removeActive = (menu) => {
    menu.querySelector(`.${activeClass}`)?.classList.remove(activeClass);
  };

  const init = () => {
    menus.forEach((menu) => {
      const items = menu.children;
      if (!items.length) return;

      removeActive(menu);
      if (window.innerWidth > 991) items[0].classList.add(activeClass);

      Array.from(items).forEach((item) => {
        item.onmouseenter = () => {
          if (window.innerWidth <= 991) return;
          removeActive(menu);
          item.classList.add(activeClass);
        };
        item.onclick = () => {
          if (window.innerWidth > 991) return;
          removeActive(menu);
          item.classList.add(activeClass);
          item.scrollIntoView();
        };
      });
    });
  };

  init();

  dropdowns.forEach((dropdown) => {
    dropdown.onmouseleave = () => init();
  });
}

/**
 * JS toggle
 *
 * Cách dùng:
 * <button class="js-toggle" toggle-target="#box">Click</button>
 * <div id="box">Content show/hide</div>
 */
window.addEventListener("template-loaded", initJsToggle);

function initJsToggle() {
  $$(".js-toggle").forEach((button) => {
    const target = button.getAttribute("toggle-target");
    if (!target) {
      document.body.innerText = `Cần thêm toggle-target cho: ${button.outerHTML}`;
    }
    button.onclick = () => {
      if (!$(target)) {
        return (document.body.innerText = `Không tìm thấy phần tử "${target}"`);
      }
      const isHidden = $(target).classList.contains("hide");

      requestAnimationFrame(() => {
        $(target).classList.toggle("hide", !isHidden);
        $(target).classList.toggle("show", isHidden);
      });
    };
  });
}

window.addEventListener("template-loaded", () => {
  const links = $$(".js-dropdown-list > li > a");

  links.forEach((link) => {
    link.onclick = () => {
      if (window.innerWidth > 991) return;
      const item = link.closest("li");
      item.classList.toggle("navbar__item--active");
    };
  });
});

// Hiệu ứng hover trên product-card
window.addEventListener("template-loaded", () => {
  const thumbs = document.querySelectorAll(".product-card__thumb");
  const titles = document.querySelectorAll(".product-card__title");

  function isMediaQueryActive() {
    return window.matchMedia("(min-width: 768px)").matches;
  }

  function handleThumbHover() {
    this.style.transform = isMediaQueryActive() ? "scale(1.1)" : "scale(1)";
  }

  function resetThumb() {
    this.style.transform = "scale(1)";
  }

  function handleTitleHover() {
    const thumb = this.closest(".product-card").querySelector(".product-card__thumb");
    thumb.style.transform = isMediaQueryActive() ? "scale(1.1)" : "scale(1)";
  }

  function resetTitle() {
    const thumb = this.closest(".product-card").querySelector(".product-card__thumb");
    thumb.style.transform = "scale(1)";
  }

  thumbs.forEach(function (thumb) {
    thumb.addEventListener("mouseover", handleThumbHover);
    thumb.addEventListener("mouseout", resetThumb);
  });

  titles.forEach(function (title) {
    title.addEventListener("mouseover", handleTitleHover);
    title.addEventListener("mouseout", resetTitle);
  });
});
