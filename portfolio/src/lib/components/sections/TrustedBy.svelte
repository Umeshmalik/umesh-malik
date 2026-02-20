<script lang="ts">
  const companies = [
    { name: "Expedia Group", period: "2024 - Present" },
    { name: "Tekion Corp", period: "2023 - 2024" },
    { name: "BYJU'S", period: "2021 - 2023" },
  ];
</script>

<section class="border-y border-brand-border px-6 py-16 lg:px-12">
  <div class="mx-auto max-w-[1160px]">
    <p class="label-mono mb-10 text-center text-brand-text-muted">
      Experience at
    </p>
    <div class="flex flex-wrap items-center justify-center gap-12 md:gap-20">
      {#each companies as company}
        <div class="corner-brackets px-6 py-4 text-center">
          <p class="text-lg font-medium text-brand-text-primary md:text-xl">
            {company.name}
          </p>
          <p class="label-mono mt-2 text-brand-text-muted">{company.period}</p>
        </div>
      {/each}
    </div>
  </div>
</section>
