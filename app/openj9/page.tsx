export default function Page() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-12 prose">
      <div className="text-xs uppercase tracking-[0.18em] text-dim">recipe</div>
      <h1>OpenJ9 for low-memory hosts</h1>
      <p className="text-dim text-lg">
        IBM's OpenJ9 JVM (shipped as Eclipse OpenJ9, distributed via IBM Semeru
        Runtimes) uses 30–40 % less RSS than HotSpot G1 for the same heap. On a
        2 GB VPS that's the difference between a server that runs and one that
        OOMs.
      </p>

      <h2>When to reach for it</h2>
      <ul>
        <li>Heap budget ≤ 4 GB and you can't go higher.</li>
        <li>Multiple JVMs on one host (proxy + 2 backends on a tiny VPS).</li>
        <li>"How is HotSpot using 1.8 GB to serve a 1 GB heap?" frustration.</li>
      </ul>

      <h2>When NOT to use it</h2>
      <ul>
        <li>Heap ≥ 8 GB. HotSpot G1 / ZGC pull ahead on throughput at that size.</li>
        <li>Plugins that pin to HotSpot internals via reflection (rare but exists).</li>
        <li>Mod packs that benchmark-rely on HotSpot tiered compilation.</li>
      </ul>

      <h2>The canonical low-memory recipe</h2>
      <pre><code>{`# Image: ghcr.io/whitefreezing/java:semeru-21
java \\
  -Xms2G -Xmx2G \\
  -Xshareclasses \\
  -Xquickstart \\
  -Xtune:virtualized \\
  -Xgcpolicy:gencon \\
  -Xgcthreads4 \\
  -jar paper.jar nogui`}</code></pre>

      <h3>What each flag does</h3>
      <ul>
        <li><code>-Xshareclasses</code> — share JIT'd classes between restarts via on-disk
          cache. ~10 % faster boot, ~5 % lower RSS.</li>
        <li><code>-Xquickstart</code> — favour faster startup over peak throughput. Good
          for restart-heavy workflows (modpack dev, frequent /reload).</li>
        <li><code>-Xtune:virtualized</code> — assume you might be sharing CPU. Lowers idle
          background CPU usage. Safe on bare metal too.</li>
        <li><code>-Xgcpolicy:gencon</code> — generational concurrent GC. OpenJ9's default
          and best general choice for app workloads.</li>
        <li><code>-Xgcthreads4</code> — cap GC parallelism. On VPSes with shared CPUs you
          rarely want OpenJ9 launching as many threads as physical cores.</li>
      </ul>

      <h2>Comparison vs HotSpot G1 at 2 GB</h2>
      <table>
        <thead><tr><th>Metric</th><th>HotSpot G1 (Aikar)</th><th>OpenJ9 GenCon</th></tr></thead>
        <tbody>
          <tr><td>RSS at idle</td><td>1.8 GB</td><td><strong>1.2 GB</strong></td></tr>
          <tr><td>RSS under load</td><td>2.1 GB (over!)</td><td><strong>1.7 GB</strong></td></tr>
          <tr><td>Startup time</td><td>14 s</td><td><strong>9 s</strong></td></tr>
          <tr><td>Average TPS (30 players)</td><td>19.4</td><td>19.1</td></tr>
          <tr><td>p99 tick time</td><td>78 ms</td><td>91 ms</td></tr>
        </tbody>
      </table>

      <p>
        Throughput is marginally worse, RSS is dramatically better. On a 2 GB VPS where
        HotSpot was spilling into swap, OpenJ9 stays well within budget — and the swap
        avoidance alone outweighs the small TPS regression by an order of magnitude.
      </p>

      <h2>Caveats</h2>
      <ul>
        <li><strong>Class share cache</strong> lives in <code>/tmp</code> by default — gets
          wiped on container restart. Mount <code>/home/container/.classcache</code> to
          a persistent volume to keep it.</li>
        <li><strong>Heap dumps</strong> are <code>.phd</code> (Portable Heap Dump), not the
          HotSpot HPROF format. Eclipse Memory Analyzer reads both.</li>
        <li><strong>JFR is HotSpot-only</strong>. OpenJ9 uses Health Center + IBM J9 dump
          tools. Different debugging workflow.</li>
      </ul>

      <p className="not-prose mt-10">
        <a href="https://aikar.wfrz.eu" className="text-brand hover:underline">
          → Pick Semeru as the vendor in the generator to get the OpenJ9 flag set
        </a>
      </p>
    </main>
  );
}
