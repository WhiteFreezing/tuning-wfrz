export default function Page() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-12 prose">
      <div className="text-xs uppercase tracking-[0.18em] text-dim">reference</div>
      <h1>JVM tuning cheat sheet</h1>
      <p className="text-dim text-lg">
        One page. Heap × Java version × CPU count → the right flags.
      </p>

      <h2>Pick the GC</h2>
      <table>
        <thead><tr><th>Heap</th><th>Java 8/11</th><th>Java 17</th><th>Java 21+</th></tr></thead>
        <tbody>
          <tr><td>≤ 2 GB</td><td>OpenJ9 GenCon</td><td>OpenJ9 GenCon</td><td>OpenJ9 GenCon</td></tr>
          <tr><td>2–12 GB</td><td>G1 (Aikar)</td><td>G1 (Aikar)</td><td>G1 (Aikar)</td></tr>
          <tr><td>12–24 GB</td><td>G1 huge-heap</td><td>G1 huge-heap</td><td>G1 huge-heap</td></tr>
          <tr><td>24–64 GB</td><td>G1 huge-heap (suboptimal)</td><td>Shenandoah gen</td><td>ZGC generational</td></tr>
          <tr><td>≥ 64 GB</td><td>upgrade Java</td><td>ZGC (single-gen)</td><td>ZGC generational</td></tr>
        </tbody>
      </table>

      <h2>Always include</h2>
      <pre><code>{`-Xms<HEAP>M -Xmx<HEAP>M       # set both to same value
-XX:+AlwaysPreTouch            # commit pages upfront (no fault-in lag)
-XX:+DisableExplicitGC         # ignore System.gc() from janky mods
-XX:+ParallelRefProcEnabled    # parallel weak/soft ref processing
-XX:+UseStringDeduplication    # dedup char[] in old gen — free RAM
-Dnetworkaddress.cache.ttl=30  # don't pin failed DNS forever`}</code></pre>

      <h2>Per-collector specifics</h2>

      <h3>G1 small/medium (≤12 GB)</h3>
      <pre><code>{`-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:+UnlockExperimentalVMOptions
-XX:G1NewSizePercent=30
-XX:G1MaxNewSizePercent=40
-XX:G1HeapRegionSize=8M
-XX:G1ReservePercent=20
-XX:G1HeapWastePercent=5
-XX:G1MixedGCCountTarget=4
-XX:InitiatingHeapOccupancyPercent=15
-XX:G1MixedGCLiveThresholdPercent=90
-XX:G1RSetUpdatingPauseTimePercent=5
-XX:SurvivorRatio=32
-XX:+PerfDisableSharedMem
-XX:MaxTenuringThreshold=1
-Dusing.aikars.flags=https://mcflags.emc.gs
-Daikars.new.flags=true`}</code></pre>

      <h3>G1 huge-heap (12 GB – 32 GB)</h3>
      <pre><code>{`# Same as above, but:
-XX:G1NewSizePercent=40
-XX:G1MaxNewSizePercent=50
-XX:G1HeapRegionSize=16M
-XX:G1ReservePercent=15
-XX:InitiatingHeapOccupancyPercent=20`}</code></pre>

      <h3>ZGC generational (Java 21+, ≥24 GB)</h3>
      <pre><code>{`-XX:+UnlockExperimentalVMOptions
-XX:+UseZGC
-XX:+ZGenerational
-XX:ZAllocationSpikeTolerance=5
-XX:-ZUncommit                  # don't release memory back to OS
-XX:+UseTransparentHugePages    # Linux only, free perf`}</code></pre>

      <h3>Shenandoah generational (Java 17, ≥24 GB, no ZGC available)</h3>
      <pre><code>{`-XX:+UnlockExperimentalVMOptions
-XX:+UseShenandoahGC
-XX:ShenandoahGCMode=generational`}</code></pre>

      <h3>OpenJ9 GenCon (Semeru)</h3>
      <pre><code>{`-Xshareclasses
-Xquickstart
-Xtune:virtualized
-Xgcpolicy:gencon
-Xgcthreads<N>          # cap at cores/2 on shared VPS`}</code></pre>

      <h2>Tune GC thread counts on big CPUs</h2>
      <table>
        <thead><tr><th>Cores</th><th>ParallelGCThreads</th><th>ConcGCThreads</th></tr></thead>
        <tbody>
          <tr><td>≤ 8</td><td>(default)</td><td>(default)</td></tr>
          <tr><td>16</td><td>12</td><td>4</td></tr>
          <tr><td>32</td><td>24</td><td>6</td></tr>
          <tr><td>64</td><td>32</td><td>8</td></tr>
          <tr><td>128+</td><td>32 (cap)</td><td>8 (cap)</td></tr>
        </tbody>
      </table>

      <h2>The two-second decision tree</h2>
      <ol>
        <li>Pick the Java version your MC requires (<a className="text-brand" href="https://aikar.wfrz.eu">generator does this</a>).</li>
        <li>Heap ≤ 2 GB → Semeru OpenJ9. Stop reading.</li>
        <li>Heap ≤ 12 GB → Adoptium + Aikar's flags. Stop reading.</li>
        <li>Heap ≥ 24 GB AND Java 21 → ZGC generational.</li>
        <li>Heap ≥ 24 GB AND Java 17 → Shenandoah generational.</li>
        <li>Otherwise → G1 huge-heap variant.</li>
      </ol>

      <p className="not-prose mt-10">
        <a href="https://aikar.wfrz.eu" className="text-brand hover:underline">
          → Generate the right flags for your exact setup
        </a>
      </p>
    </main>
  );
}
