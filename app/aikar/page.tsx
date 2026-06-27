export default function Page() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-12 prose">
      <div className="text-xs uppercase tracking-[0.18em] text-dim">essay</div>
      <h1>Stop using Aikar's flags verbatim in 2026</h1>
      <p className="text-dim text-lg">
        Aikar's tuning is the most-copy-pasted JVM config in Minecraft hosting. It's also
        almost a decade old. Here's what it was designed for, what it gets wrong on modern
        hardware, and what to swap.
      </p>

      <h2>What Aikar actually tuned</h2>
      <p>The flagship flag set was finalised around 2017–2018 against:</p>
      <ul>
        <li><strong>HotSpot G1GC</strong> on Java 8 (later 11 / 17 update-compatible).</li>
        <li><strong>4–12 GB heaps</strong> on consumer hardware (8-core Intel of the era).</li>
        <li><strong>Spigot / Paper</strong> tick loop with ~80 % short-lived allocations and a
          handful of long-lived caches.</li>
      </ul>
      <p>
        Within that envelope the tuning is genuinely great. The young-gen
        sizing (<code>G1NewSizePercent=30</code>, <code>G1MaxNewSizePercent=40</code>),
        the <code>G1HeapWastePercent=5</code> aggression and <code>MaxTenuringThreshold=1</code>
        all match a workload where 80 % of allocations die in eden, and survivor → old
        promotion is wasted work.
      </p>

      <h2>What changed since 2017</h2>
      <ul>
        <li><strong>ZGC went generational in Java 21</strong>. Pauses are now consistently
          sub-millisecond at 64 GB+ heaps. G1 cannot match this even at 16 GB.</li>
        <li><strong>Shenandoah added generational mode</strong> in Java 17. Similar profile
          to G1 throughput-wise, dramatically better pause tail.</li>
        <li><strong>OpenJ9 (Semeru)</strong> is a real option for ≤4 GB hosts — it uses
          30–40 % less RSS than HotSpot for the same heap.</li>
        <li><strong>Modern CPUs</strong> have 16–64 cores. Aikar didn't tune
          <code>ParallelGCThreads</code> / <code>ConcGCThreads</code>; HotSpot's defaults
          assume 4–8 cores and end up bottlenecked.</li>
        <li><strong>Java 17 → 21 → 25</strong> brought transparent huge pages, string
          deduplication, generational concurrent GCs, and major JIT improvements.</li>
      </ul>

      <h2>The rule of thumb</h2>
      <table>
        <thead><tr><th>Heap</th><th>Java</th><th>What to use</th></tr></thead>
        <tbody>
          <tr><td>≤ 4 GB</td><td>17 or 21</td><td>OpenJ9 GenCon (Semeru) — lower RSS, no tuning needed</td></tr>
          <tr><td>4 – 12 GB</td><td>17 or 21</td><td>G1 + Aikar's flags (still optimal here)</td></tr>
          <tr><td>12 – 32 GB</td><td>17</td><td>G1 huge-heap variant (<code>G1NewSizePercent=40</code>)</td></tr>
          <tr><td>12 – 32 GB</td><td>21+</td><td>Generational ZGC (<code>-XX:+UseZGC -XX:+ZGenerational</code>)</td></tr>
          <tr><td>≥ 32 GB</td><td>21+</td><td>Generational ZGC, full stop. G1 will choke.</td></tr>
        </tbody>
      </table>

      <h2>The flag set you actually want for 32 GB / Java 21</h2>
      <pre><code>{`java -Xms32G -Xmx32G \\
  -XX:+UnlockExperimentalVMOptions \\
  -XX:+UseZGC -XX:+ZGenerational \\
  -XX:ZAllocationSpikeTolerance=5 \\
  -XX:-ZUncommit \\
  -XX:+AlwaysPreTouch \\
  -XX:+DisableExplicitGC \\
  -XX:+ParallelRefProcEnabled \\
  -XX:+UseTransparentHugePages \\
  -XX:+UseStringDeduplication \\
  -XX:ParallelGCThreads=24 \\
  -XX:ConcGCThreads=6 \\
  -jar paper.jar nogui`}</code></pre>

      <h2>What about Aikar's <code>-Daikars.new.flags=true</code>?</h2>
      <p>
        That flag toggles PaperMC's internal default for the chunk-loading executor —
        moving more work off the main thread. It's <em>not</em> a JVM tunable, just a
        Paper config signal. Safe to keep. Doesn't matter on Velocity / Forge / Fabric.
      </p>

      <h2>tl;dr</h2>
      <ul>
        <li>4–12 GB Paper on Java 11/17? Keep using Aikar's. They're great here.</li>
        <li>Modern host (≥16 cores, ≥24 GB heap, Java 21+)? Switch to ZGC generational
          and add the parallel-threads tuning.</li>
        <li>RAM-constrained (≤4 GB)? Use OpenJ9 / Semeru — no flags needed.</li>
      </ul>

      <p className="not-prose mt-10">
        <a href="https://aikar.wfrz.eu" className="text-brand hover:underline">
          → Open the generator to produce the right flags for your setup
        </a>
      </p>
    </main>
  );
}
