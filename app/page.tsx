import Link from "next/link";

export default function HomePage() {
  return (
    <main className="max-w-4xl mx-auto px-5 py-12">
      <div className="text-xs uppercase tracking-[0.18em] text-dim mb-2">wfrz.eu · opinionated guide</div>
      <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
        Modern Minecraft JVM tuning
        <span className="text-brand">.</span>
      </h1>
      <p className="text-dim mt-4 text-lg max-w-2xl">
        Aikar's flags are nearly a decade old. They're still the right baseline for a 4 GB
        Paper server on Java 11 — but on a 32 GB Forge server on Java 21, you're leaving
        20–40% throughput on the table. This site documents what to actually use in 2026.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mt-10">
        <Article
          slug="/aikar"
          tag="essay"
          title="Stop using Aikar's flags verbatim in 2026"
          summary="What Aikar tuned for, why it doesn't fit modern JVMs, and what to swap when."
        />
        <Article
          slug="/zgc"
          tag="benchmark"
          title="ZGC vs G1GC at 32 GB — real numbers"
          summary="A 100-player Paper server running both collectors for a week. Pause times, throughput, GC overhead."
        />
        <Article
          slug="/openj9"
          tag="recipe"
          title="OpenJ9 for low-memory hosts"
          summary="Shared classes + tuned virtualized mode. 2 GB Paper that fits where HotSpot doesn't."
        />
        <Article
          slug="/cheatsheet"
          tag="reference"
          title="JVM tuning cheat sheet"
          summary="One page. Heap size + Java version → flags. Plus when to use ParallelGCThreads."
        />
      </div>

      <div className="card p-5 mt-10">
        <div className="text-sm font-semibold mb-2">Companion tool</div>
        <p className="text-dim text-sm mb-3">
          Don't copy flags by hand. Paste your server type, RAM and Java version into the
          generator and it emits the right STARTUP line, Pterodactyl egg JSON, docker run,
          and systemd unit.
        </p>
        <a href="https://aikar.wfrz.eu" className="text-brand font-semibold hover:underline">
          Open the flag generator →
        </a>
      </div>
    </main>
  );
}

function Article({ slug, title, summary, tag }: { slug: string; title: string; summary: string; tag: string }) {
  return (
    <Link href={slug} className="card p-5 hover:border-brand/50 transition">
      <div className="text-[10px] uppercase tracking-wider text-brand mb-2">{tag}</div>
      <h3 className="font-bold text-lg leading-tight">{title}</h3>
      <p className="text-sm text-dim mt-2 line-clamp-3">{summary}</p>
    </Link>
  );
}
