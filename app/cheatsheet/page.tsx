export default function Page() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-12 prose">
      <div className="text-xs uppercase tracking-[0.18em] text-dim">reference · MC 26.x / Java 25</div>
      <h1>JVM tuning cheat sheet</h1>
      <p className="text-dim text-lg">
        One page. Heap × Java version × CPU count → the right flags.
      </p>

      <h2>Minecraft → Java baseline (from Mojang's piston-meta)</h2>
      <table>
        <thead><tr><th>MC version</th><th>Java required</th></tr></thead>
        <tbody>
          <tr><td>1.16 and older</td><td>8</td></tr>
          <tr><td>1.17.x</td><td>16 (Java 17 works fine)</td></tr>
          <tr><td>1.18 – 1.20.4</td><td>17</td></tr>
          <tr><td>1.20.5 – 1.21.11</td><td>21</td></tr>
          <tr><td><strong>26.1+ (year-based)</strong></td><td><strong>25 LTS</strong></td></tr>
        </tbody>
      </table>

      <h2>ZGC generational timeline (verified vs Oracle migrate docs)</h2>
      <table>
        <thead><tr><th>JDK</th><th>What's true</th><th>JEP</th></tr></thead>
        <tbody>
          <tr><td>21 (LTS)</td><td>Generational ZGC opt-in via <code>-XX:+ZGenerational</code></td><td>439</td></tr>
          <tr><td>22</td><td>Same as 21 — opt-in</td><td>—</td></tr>
          <tr><td>23</td><td>Generational becomes the <strong>default</strong>; non-gen deprecated</td><td>474</td></tr>
          <tr><td>24</td><td>Non-generational mode <strong>removed</strong>; <code>-XX:+ZGenerational</code> is now a no-op</td><td>490</td></tr>
          <tr><td>25 (LTS)</td><td>No further ZGC changes; compact-headers promoted to Product</td><td>519</td></tr>
        </tbody>
      </table>

      <h2>Pick the GC</h2>
      <table>
        <thead><tr><th>Heap</th><th>Java 8/11</th><th>Java 17</th><th>Java 21–22</th><th>Java 23+</th></tr></thead>
        <tbody>
          <tr><td>≤ 2 GB</td><td>OpenJ9</td><td>OpenJ9</td><td>OpenJ9</td><td>OpenJ9</td></tr>
          <tr><td>2–12 GB</td><td>G1 (Aikar)</td><td>G1 (Aikar)</td><td>G1 (Aikar)</td><td>G1 (Aikar)</td></tr>
          <tr><td>12–24 GB</td><td>G1 huge</td><td>G1 huge</td><td>ZGC + <code>+ZGenerational</code></td><td>ZGC (gen is default)</td></tr>
          <tr><td>24–64 GB</td><td>G1 huge (poor)</td><td>Shenandoah gen</td><td>ZGC + <code>+ZGenerational</code></td><td>ZGC</td></tr>
          <tr><td>≥ 64 GB</td><td>upgrade Java</td><td>Shenandoah gen</td><td>ZGC + <code>+ZGenerational</code></td><td>ZGC + compact headers</td></tr>
        </tbody>
      </table>

      <h2>Always include</h2>
      <pre><code>{`-Xms<HEAP>M -Xmx<HEAP>M       # set both to same value
-XX:+AlwaysPreTouch            # commit pages upfront (no fault-in lag)
-XX:+DisableExplicitGC         # ignore System.gc() from janky mods
-XX:+ParallelRefProcEnabled    # parallel weak/soft ref processing
-XX:+UseStringDeduplication    # dedup char[] in old gen — free RAM (Java 17+)
-Dnetworkaddress.cache.ttl=30  # don't pin failed DNS forever`}</code></pre>

      <h3>Java 24 / 25 — Compact Object Headers</h3>
      <pre><code>{`# Java 25 (JEP 519 Product) — no unlock needed
-XX:+UseCompactObjectHeaders   # ~4 bytes saved per object on avg

# Java 24 (JEP 450 Experimental) — needs unlock
-XX:+UnlockExperimentalVMOptions
-XX:+UseCompactObjectHeaders`}</code></pre>
      <p className="text-dim">
        Works with G1, ZGC, Shenandoah and Parallel. The header shrinks from
        96–128 bits to 64 bits. Still opt-in even in JDK 25 — Oracle reserves the
        right to flip the default later. Use on heaps ≥ 8 GB for measurable gains.
      </p>
      <h3>Linux-only freebie (Java 17+)</h3>
      <pre><code>{`-XX:+UseTransparentHugePages   # TLB win; harmless on Win/macOS`}</code></pre>

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

      <h3>ZGC on Java 25 (recommended for MC 26.x, ≥12 GB heap)</h3>
      <pre><code>{`-XX:+UseZGC                    # only mode left since JDK 24 (JEP 490)
-XX:ZAllocationSpikeTolerance=5
-XX:-ZUncommit
-XX:+UseTransparentHugePages
-XX:+UseCompactObjectHeaders   # JEP 519 Product in JDK 25`}</code></pre>

      <h3>ZGC on Java 23 — generational by default</h3>
      <pre><code>{`-XX:+UseZGC                    # generational since JDK 23 (JEP 474)
-XX:+UnlockExperimentalVMOptions
-XX:ZAllocationSpikeTolerance=5
-XX:-ZUncommit`}</code></pre>

      <h3>ZGC on Java 21–22 — explicit opt-in for generational</h3>
      <pre><code>{`-XX:+UseZGC
-XX:+ZGenerational              # required on JDK 21–22 (JEP 439)
-XX:+UnlockExperimentalVMOptions
-XX:ZAllocationSpikeTolerance=5
-XX:-ZUncommit`}</code></pre>

      <h3>Shenandoah generational (Java 17, ≥24 GB, no ZGC-Gen available)</h3>
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
        <li>Heap ≥ 24 GB AND Java 23+ → ZGC (just <code>-XX:+UseZGC</code>; generational is default since 23, only mode since 24).</li>
        <li>Heap ≥ 24 GB AND Java 21–22 → ZGC + <code>-XX:+ZGenerational</code> (opt-in).</li>
        <li>Heap ≥ 24 GB AND Java 17 → Shenandoah generational (check your build supports it).</li>
        <li>Otherwise → G1 huge-heap variant.</li>
        <li><em>Add <code>-XX:+UseCompactObjectHeaders</code> on heap ≥ 8 GB if on Java 24 (with Unlock flag) or Java 25 (no Unlock needed).</em></li>
      </ol>

      <p className="not-prose mt-10">
        <a href="https://aikar.wfrz.eu" className="text-brand hover:underline">
          → Generate the right flags for your exact setup
        </a>
      </p>
    </main>
  );
}
