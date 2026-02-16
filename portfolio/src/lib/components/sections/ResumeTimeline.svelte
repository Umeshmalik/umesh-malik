<script lang="ts">
  import { onMount } from "svelte";
  import { inview } from "svelte-inview";
  import Badge from "$lib/components/ui/Badge.svelte";
  import type { ExperienceEntry, EducationEntry } from "$lib/data/resume";

  type Entry = ExperienceEntry | EducationEntry;

  interface Props {
    entries: Entry[];
  }

  let { entries }: Props = $props();

  let ready = $state(false);
  let revealedSet = $state(new Set<number>());

  onMount(() => {
    // Delay so browser paints the hidden state before observers fire
    requestAnimationFrame(() => {
      ready = true;
    });
  });
</script>

{#snippet experienceCard(exp: ExperienceEntry)}
  <div class="corner-brackets border border-brand-card-border bg-brand-card p-6">
    <h3 class="text-lg font-medium text-white">{exp.role}</h3>
    <p class="label-mono mt-1 text-brand-accent">{exp.company}</p>
    <p class="mt-2 text-sm text-brand-text-muted">{exp.period}</p>
    <p class="mt-1 text-sm text-brand-text-muted">{exp.location}</p>
    <ul class="timeline-card-highlights mt-4 space-y-2">
      {#each exp.highlights as highlight}
        <li class="text-sm font-light text-brand-text-secondary">
          <span class="mr-2 text-brand-accent">&bull;</span>{highlight}
        </li>
      {/each}
    </ul>
    <div class="mt-4 flex flex-wrap gap-2">
      {#each exp.tech as tech}
        <Badge>{tech}</Badge>
      {/each}
    </div>
  </div>
{/snippet}

{#snippet educationCard(edu: EducationEntry)}
  <div class="corner-brackets border border-brand-card-border bg-brand-card p-6">
    <h3 class="text-lg font-medium text-white">{edu.degree}</h3>
    <p class="label-mono mt-1 text-brand-accent">{edu.field}</p>
    <p class="mt-2 text-sm text-brand-text-secondary">{edu.institution}</p>
    <p class="mt-1 text-sm text-brand-text-muted">{edu.period}</p>
  </div>
{/snippet}

<div class="timeline-container">
  <div class="timeline-line"></div>

  {#each entries as entry, i}
    {@const isLeft = i % 2 === 0}

    <div
      class="timeline-entry"
      class:timeline-revealed={revealedSet.has(i)}
      use:inview={{ threshold: 0.15, rootMargin: '0px 0px -60px 0px' }}
      oninview_change={(e) => { if (ready && e.detail.inView) { revealedSet.add(i); revealedSet = revealedSet; } }}
    >
      {#if isLeft}
        <div class="timeline-card-left timeline-card-slide-left">
          {#if entry.type === 'experience'}
            {@render experienceCard(entry as ExperienceEntry)}
          {:else}
            {@render educationCard(entry as EducationEntry)}
          {/if}
        </div>

        <div class="timeline-center">
          <div class="timeline-dot timeline-dot-animate" class:timeline-dot-current={entry.isCurrent}></div>
          <span class="timeline-year">{entry.year}</span>
        </div>

        <div class="timeline-empty"></div>
      {:else}
        <div></div>

        <div class="timeline-center">
          <div class="timeline-dot timeline-dot-animate" class:timeline-dot-current={entry.isCurrent}></div>
          <span class="timeline-year">{entry.year}</span>
        </div>

        <div class="timeline-card-right timeline-card-slide-right">
          {#if entry.type === 'experience'}
            {@render experienceCard(entry as ExperienceEntry)}
          {:else}
            {@render educationCard(entry as EducationEntry)}
          {/if}
        </div>
      {/if}
    </div>
  {/each}
</div>
