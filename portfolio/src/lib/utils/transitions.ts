import type { TransitionConfig } from 'svelte/transition';

interface ClipRevealParams {
	duration?: number;
	delay?: number;
}

export function clipReveal(
	_node: Element,
	{ duration = 800, delay = 0 }: ClipRevealParams = {},
): TransitionConfig {
	return {
		duration,
		delay,
		css: (t: number) => {
			// Ease-out cubic deceleration
			const eased = 1 - Math.pow(1 - t, 3);
			const insetBottom = 100 - eased * 100;
			return `clip-path: inset(${insetBottom}% 0 0 0)`;
		},
	};
}
