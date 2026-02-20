import type { ActionReturn } from 'svelte/action';

interface TiltParams {
	maxDeg?: number;
	scale?: number;
}

export function tilt(
	node: HTMLElement,
	params: TiltParams = {},
): ActionReturn<TiltParams> {
	const maxDeg = params.maxDeg ?? 3;
	const scale = params.scale ?? 1.02;
	let rafId: number | null = null;

	// Only activate on fine pointer devices (desktop)
	const mql = window.matchMedia('(pointer: fine)');
	if (!mql.matches) return {};

	// Respect reduced motion
	const motionMql = window.matchMedia('(prefers-reduced-motion: reduce)');
	if (motionMql.matches) return {};

	node.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
	node.style.willChange = 'transform';

	function handleMouseEnter() {
		node.style.transition = 'transform 0.15s ease-out';
	}

	function handleMouseMove(e: MouseEvent) {
		if (rafId !== null) return;
		rafId = requestAnimationFrame(() => {
			const rect = node.getBoundingClientRect();
			const x = (e.clientX - rect.left) / rect.width;
			const y = (e.clientY - rect.top) / rect.height;
			const rotateX = (0.5 - y) * maxDeg * 2;
			const rotateY = (x - 0.5) * maxDeg * 2;
			node.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;
			rafId = null;
		});
	}

	function handleMouseLeave() {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		node.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
		node.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
	}

	node.addEventListener('mouseenter', handleMouseEnter, { passive: true });
	node.addEventListener('mousemove', handleMouseMove, { passive: true });
	node.addEventListener('mouseleave', handleMouseLeave, { passive: true });

	return {
		destroy() {
			node.removeEventListener('mouseenter', handleMouseEnter);
			node.removeEventListener('mousemove', handleMouseMove);
			node.removeEventListener('mouseleave', handleMouseLeave);
			if (rafId !== null) cancelAnimationFrame(rafId);
			node.style.willChange = '';
		},
	};
}
