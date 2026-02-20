import type { ActionReturn } from 'svelte/action';

interface MagneticParams {
	strength?: number;
}

export function magnetic(
	node: HTMLElement,
	params: MagneticParams = {},
): ActionReturn<MagneticParams> {
	const strength = params.strength ?? 5;
	let rafId: number | null = null;

	// Only activate on fine pointer devices (desktop)
	const mql = window.matchMedia('(pointer: fine)');
	if (!mql.matches) return {};

	// Also respect reduced motion
	const motionMql = window.matchMedia('(prefers-reduced-motion: reduce)');
	if (motionMql.matches) return {};

	node.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';

	function handleMouseMove(e: MouseEvent) {
		if (rafId !== null) return;
		rafId = requestAnimationFrame(() => {
			const rect = node.getBoundingClientRect();
			const centerX = rect.left + rect.width / 2;
			const centerY = rect.top + rect.height / 2;
			const dx = (e.clientX - centerX) / (rect.width / 2);
			const dy = (e.clientY - centerY) / (rect.height / 2);
			const x = dx * strength;
			const y = dy * strength;
			node.style.transform = `translate(${x}px, ${y}px)`;
			rafId = null;
		});
	}

	function handleMouseLeave() {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		node.style.transform = 'translate(0, 0)';
	}

	node.addEventListener('mousemove', handleMouseMove, { passive: true });
	node.addEventListener('mouseleave', handleMouseLeave, { passive: true });

	return {
		destroy() {
			node.removeEventListener('mousemove', handleMouseMove);
			node.removeEventListener('mouseleave', handleMouseLeave);
			if (rafId !== null) cancelAnimationFrame(rafId);
		},
	};
}
