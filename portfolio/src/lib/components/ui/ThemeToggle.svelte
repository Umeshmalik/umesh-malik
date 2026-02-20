<script lang="ts">
  import { onMount } from "svelte";

  let theme = $state<"dark" | "light">("dark");
  let mounted = $state(false);
  let buttonEl: HTMLButtonElement;

  onMount(() => {
    theme =
      (document.documentElement.dataset.theme as "dark" | "light") || "dark";
    // Delay so the initial render doesn't play the spin animation
    requestAnimationFrame(() => {
      mounted = true;
    });
  });

  function applyTheme(newTheme: "dark" | "light") {
    theme = newTheme;
    document.documentElement.dataset.theme = newTheme;
    localStorage.setItem("theme", newTheme);

    const color = newTheme === "light" ? "#FDFAF5" : "#060503";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", color);
    document
      .querySelector('meta[name="color-scheme"]')
      ?.setAttribute("content", newTheme);
  }

  function toggle() {
    const newTheme = theme === "dark" ? "light" : "dark";

    // Use View Transition API for circular clip-path animation
    if (document.startViewTransition) {
      const rect = buttonEl.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      document.documentElement.dataset.transition = "theme";

      const transition = document.startViewTransition(() => {
        applyTheme(newTheme);
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 500,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      });

      transition.finished.then(() => {
        delete document.documentElement.dataset.transition;
      });
    } else {
      applyTheme(newTheme);
    }
  }

  let isDark = $derived(theme === "dark");
</script>

<button
  type="button"
  bind:this={buttonEl}
  onclick={toggle}
  class="theme-toggle inline-flex h-9 w-9 items-center justify-center rounded-md text-brand-text-secondary transition-colors duration-200 hover:text-brand-text-primary"
  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
>
  <div class="icon-wrapper" class:animated={mounted}>
    <!-- Sun icon -->
    <svg
      class="icon-svg sun-icon"
      class:active={isDark}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="1.5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>

    <!-- Moon icon -->
    <svg
      class="icon-svg moon-icon"
      class:active={!isDark}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="1.5"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </div>
</button>

<style>
  .icon-wrapper {
    position: relative;
    width: 20px;
    height: 20px;
  }

  .icon-svg {
    position: absolute;
    inset: 0;
    width: 20px;
    height: 20px;
    opacity: 0;
    transform: rotate(90deg) scale(0);
  }

  .icon-svg.active {
    opacity: 1;
    transform: rotate(0deg) scale(1);
  }

  /* Only animate after mount so initial render is instant */
  .animated .icon-svg {
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
                opacity 0.25s ease;
  }

  /* Button hover: gentle scale */
  .theme-toggle:hover .icon-wrapper {
    transform: scale(1.1);
    transition: transform 0.2s ease;
  }

  /* Button press: quick squeeze */
  .theme-toggle:active .icon-wrapper {
    transform: scale(0.9);
    transition: transform 0.1s ease;
  }

</style>
