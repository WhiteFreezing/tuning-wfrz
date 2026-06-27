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

      <h2>What changed since 2017 (verified against Oracle migration docs)</h2>
      <ul>
        <li><strong>ZGC went generational</strong> as opt-in in <strong>JDK 21</strong>
          (JEP 439), became <strong>default in JDK 23</strong> (JEP 474), and the
          non-generational variant was <strong>removed entirely in JDK 24</strong>
          (JEP 490). On JDK 24+ you no longer pass <code>-XX:+ZGenerational</code> —
          it's the only mode that exists.</li>
        <li><strong>Compact object headers</strong> — experimental in JDK 24 (JEP 450),
          promoted to <strong>Product feature in JDK 25</strong> (JEP 519). Saves
          about <strong>4 bytes per object on average</strong> (the header shrinks
          from 96–128 bits to 64 bits). Still opt-in via
          <code>-XX:+UseCompactObjectHeaders</code> — it's stable, just not yet
          default-on while Oracle gathers field data.</li>
        <li><strong>Shenandoah</strong> ships a generational mode behind
          <code>-XX:ShenandoahGCMode=generational</code> in recent OpenJDK builds.
          Production-readiness varies per vendor build — confirm with your runtime
          before deploying.</li>
        <li><strong>OpenJ9 (Semeru)</strong> is still a real option for ≤4 GB hosts —
          uses 30–40 % less RSS than HotSpot for the same heap.</li>
        <li><strong>Modern CPUs</strong> have 16–64 cores. Aikar didn't tune
          <code>ParallelGCThreads</code> / <code>ConcGCThreads</code>; HotSpot's defaults
          assume 4–8 cores and end up bottlenecked on Ryzen 9 / Threadripper / Epyc.</li>
      </ul>

      <h2>The rule of thumb</h2>
      <table>
        <thead><tr><th>Heap</th><th>Java</th><th>What to use</th></tr></thead>
        <tbody>
          <tr><td>≤ 4 GB</td><td>17 – 25</td><td>OpenJ9 GenCon (Semeru) — lower RSS, no tuning needed</td></tr>
          <tr><td>4 – 12 GB</td><td>17 – 25</td><td>G1 + Aikar's flags (still optimal here)</td></tr>
          <tr><td>12 – 32 GB</td><td>17 only</td><td>G1 huge-heap variant (<code>G1NewSizePercent=40</code>)</td></tr>
          <tr><td>12 – 32 GB</td><td>21 – 22</td><td>ZGC generational (opt-in via <code>-XX:+ZGenerational</code>)</td></tr>
          <tr><td>12 – 32 GB</td><td>23</td><td>ZGC generational is default — flag redundant</td></tr>
          <tr><td>12 – 32 GB</td><td>24 – 25</td><td>ZGC (only mode left; just <code>-XX:+UseZGC</code>)</td></tr>
          <tr><td>≥ 32 GB</td><td>21+</td><td>ZGC, full stop. G1 will choke.</td></tr>
          <tr><td>≥ 8 GB</td><td>25</td><td>add <code>-XX:+UseCompactObjectHeaders</code> for ~4 B/obj RAM win</td></tr>
        </tbody>
      </table>

      <h2>Flag set for 32 GB / Java 25 / 26.x server</h2>
      <pre><code>{`java -Xms32G -Xmx32G \\
  -XX:+UseZGC \\
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
        Notice what's missing vs JDK 21 / 22 ZGC: no
        <code>-XX:+ZGenerational</code> (the non-gen variant was removed in JDK 24, JEP 490)
        and no <code>-XX:+UnlockExperimentalVMOptions</code> for compact headers
        (promoted to Product in JEP 519 in JDK 25). On JDK 24 you'd still need the
        Unlock flag because compact headers were experimental there (JEP 450).
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
