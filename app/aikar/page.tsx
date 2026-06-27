export default function Page() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-12 prose">
      <div className="text-xs uppercase tracking-[0.18em] text-dim">essay · updated for MC 26.x / Java 25</div>
      <h1>Stop using Aikar's flags verbatim in 2026</h1>
      <p className="text-dim text-lg">
        Aikar's tuning is the most-copy-pasted JVM config in Minecraft hosting. It's also
        almost a decade old, was tuned for HotSpot G1 on 4–12 GB heaps, and the world has
        moved on. Here's what it gets wrong on modern hardware (Java 25 LTS, year-based
        Mojang releases, 16+ core consumer CPUs), and what to swap.
      </p>

      <h2>The version cliff you may not know about</h2>
      <p>
        After <code>1.21.11</code> in 2025, Mojang switched to year-based versioning. The
        first 2026 release is <code>26.1</code> (then <code>26.2</code> etc.) — and they
        bumped the JVM baseline at the same time:
      </p>
      <table>
        <thead><tr><th>MC version</th><th>Java baseline</th></tr></thead>
        <tbody>
          <tr><td>1.18 – 1.20.4</td><td>17</td></tr>
          <tr><td>1.20.5 – 1.21.11</td><td>21</td></tr>
          <tr><td>26.1 onward</td><td><strong>25 (LTS)</strong></td></tr>
        </tbody>
      </table>
      <p>
        If you're on the 26.x line you're already on Java 25, and the original Aikar set
        was never tuned for it. Compact object headers (JEP 519, GA in 25) alone change
        the math.
      </p>

      <h2>What Aikar actually tuned</h2>
      <p>The flagship flag set was finalised around 2017–2018 against:</p>
      <ul>
        <li><strong>HotSpot G1GC</strong> on Java 8 (later 11 / 17 update-compatible).</li>
        <li><strong>4–12 GB heaps</strong> on consumer hardware (8-core Intel of the era).</li>
        <li><strong>Spigot / Paper</strong> tick loop with ~80 % short-lived allocations.</li>
      </ul>
      <p>
        Within that envelope the tuning is genuinely great — and still is. The young-gen
        sizing, <code>G1HeapWastePercent=5</code> aggression and
        <code>MaxTenuringThreshold=1</code> all match a workload where 80 % of
        allocations die in eden, and survivor → old promotion is wasted work. On a 4 GB
        Paper server it's still the right answer in 2026.
      </p>

      <h2>What changed since 2017</h2>
      <ul>
        <li><strong>ZGC went generational in Java 21</strong> (opt-in), <strong>became default in
          Java 24</strong>, and <strong>the legacy single-gen ZGC was removed in Java 25</strong>.
          Pauses are now consistently sub-millisecond at 64 GB+ heaps. G1 cannot match this
          even at 16 GB.</li>
        <li><strong>Shenandoah added generational mode</strong> in Java 21+. Similar profile
          to G1 throughput-wise, dramatically better pause tail.</li>
        <li><strong>Compact object headers (JEP 519)</strong> GA in Java 25 — 8 bytes off
          every object. Real RAM win on entity-heavy modpacks and item-frame farms.</li>
        <li><strong>Adaptive Heap Sizing</strong> in Java 24+. The <code>Xms = Xmx</code>
          pattern still wins for latency, but AHS is fine if you want to set <code>Xms</code>
          lower and let it grow.</li>
        <li><strong>OpenJ9 (Semeru)</strong> is still a real option for ≤4 GB hosts —
          uses 30–40 % less RSS than HotSpot for the same heap.</li>
        <li><strong>Modern CPUs</strong> have 16–64 cores. Aikar didn't tune
          <code>ParallelGCThreads</code> / <code>ConcGCThreads</code>; HotSpot's defaults
          assume 4–8 cores and end up bottlenecked.</li>
      </ul>

      <h2>The rule of thumb</h2>
      <table>
        <thead><tr><th>Heap</th><th>Java</th><th>What to use</th></tr></thead>
        <tbody>
          <tr><td>≤ 4 GB</td><td>17 – 25</td><td>OpenJ9 GenCon (Semeru) — lower RSS, no tuning needed</td></tr>
          <tr><td>4 – 12 GB</td><td>17 – 25</td><td>G1 + Aikar's flags (still optimal here)</td></tr>
          <tr><td>12 – 32 GB</td><td>17 only</td><td>G1 huge-heap variant (<code>G1NewSizePercent=40</code>)</td></tr>
          <tr><td>12 – 32 GB</td><td>21 – 23</td><td>ZGC generational (opt-in via <code>-XX:+ZGenerational</code>)</td></tr>
          <tr><td>12 – 32 GB</td><td>24 – 25</td><td>ZGC (generational is default; just <code>-XX:+UseZGC</code>)</td></tr>
          <tr><td>≥ 32 GB</td><td>21+</td><td>ZGC, full stop. G1 will choke.</td></tr>
          <tr><td>any heap</td><td>25 only</td><td>add <code>-XX:+UseCompactObjectHeaders</code> on heaps ≥ 8 GB</td></tr>
        </tbody>
      </table>

      <h2>Flag set for 32 GB / Java 25 / 26.x server</h2>
      <pre><code>{`java -Xms32G -Xmx32G \\
  -XX:+UseZGC \\
  -XX:+UnlockExperimentalVMOptions \\
  -XX:ZAllocationSpikeTolerance=5 \\
  -XX:-ZUncommit \\
  -XX:+AlwaysPreTouch \\
  -XX:+DisableExplicitGC \\
  -XX:+ParallelRefProcEnabled \\
  -XX:+UseTransparentHugePages \\
  -XX:+UseStringDeduplication \\
  -XX:+UseCompactObjectHeaders \\
  -XX:ParallelGCThreads=24 \\
  -XX:ConcGCThreads=6 \\
  -jar paper.jar nogui`}</code></pre>
      <p className="text-dim">
        Notice what's <strong>missing</strong> vs Java 21 ZGC: no
        <code>-XX:+ZGenerational</code>. It's the default in Java 24+, and using it on Java 25
        is harmless but unnecessary — and if Oracle yanks the alias one day, your config
        breaks for no reason.
      </p>

      <h2>What about Aikar's <code>-Daikars.new.flags=true</code>?</h2>
      <p>
        That flag toggles PaperMC's internal default for the chunk-loading executor —
        moving more work off the main thread. It's <em>not</em> a JVM tunable, just a
        Paper config signal. Safe to keep. Doesn't matter on Velocity / Forge / Fabric.
      </p>

      <h2>tl;dr</h2>
      <ul>
        <li>4–12 GB Paper on Java 17/21? <strong>Keep using Aikar's.</strong> They're great here.</li>
        <li>Running 26.1 / 26.2 (Java 25 required)? <strong>Switch to ZGC</strong> if heap ≥ 8 GB,
          add <code>-XX:+UseCompactObjectHeaders</code> for the RAM win.</li>
        <li>Modern host (≥16 cores, ≥24 GB heap, Java 21+)? Add the parallel-threads tuning.</li>
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
