import { Mail, Twitter, Github, ChevronRight } from "lucide-react";

/* ================= NFT VIDEOS ================= */

const nftVideos = [
  {
    url: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_053923_22c0a6a5-313c-474c-85ff-3b50d25e944a.mp4",
    score: "8.7/10",
  },
  {
    url: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_054411_511c1b7a-fb2f-42ef-bf6c-32c0b1a06e79.mp4",
    score: "9/10",
  },
  {
    url: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055427_ac7035b5-9f3b-4289-86fc-941b2432317d.mp4",
    score: "8.2/10",
  },
];

export default function Dashboard() {
  return (
    <div className="relative w-full min-h-screen bg-[#010828] text-[#EFF4FF] font-mono">

      {/* ================= TEXTURE ================= */}

      <div
        className="fixed inset-0 z-50 pointer-events-none opacity-60 mix-blend-lighten"
        style={{
          backgroundImage: "url('/texture.png')",
          backgroundSize: "cover",
        }}
      />

      {/* ====================================================== */}
      {/* ================= SECTION 1 HERO ===================== */}
      {/* ====================================================== */}

      <section className="relative min-h-screen overflow-hidden rounded-b-[32px]">

        {/* VIDEO */}

        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4"
          autoPlay
          muted
          loop
          playsInline
        />

        <div className="relative z-10 max-w-[1831px] mx-auto px-6 md:px-12 pt-10">

          {/* HEADER */}

          <div className="flex justify-between items-center">

            <div className="font-grotesk uppercase text-[16px]">
              ORBIS.NFT
            </div>

            <nav className="hidden lg:flex liquid-glass rounded-[28px] px-[52px] py-[24px] gap-10 font-grotesk text-[13px] uppercase">

              {["Homepage", "Gallery", "Buy NFT", "FAQ", "Contact"].map(
                (item) => (
                  <a key={item} href="#" className="hover:text-[#6FFF00]">
                    {item}
                  </a>
                )
              )}

            </nav>

          </div>

          {/* HERO TEXT */}

          <div className="mt-32 lg:ml-32 relative">

            <h1 className="font-grotesk uppercase text-[40px] sm:text-[60px] md:text-[75px] lg:text-[90px] leading-[1.05] md:leading-[1] max-w-[780px]">

              Beyond earth <br />
              and ( its ) familiar boundaries

            </h1>

            <span className="absolute right-0 top-full mt-4 font-condiment text-[#6FFF00] text-[24px] sm:text-[32px] md:text-[40px] lg:text-[48px] -rotate-1 opacity-90 mix-blend-exclusion">

              Nft collection

            </span>

          </div>

          {/* SOCIAL */}

          <div className="hidden lg:flex flex-col gap-4 absolute right-10 top-28">

            {[Mail, Twitter, Github].map((Icon, i) => (
              <button
                key={i}
                className="liquid-glass w-[56px] h-[56px] rounded-[1rem] flex items-center justify-center hover:bg-white/10"
              >
                <Icon size={20} />
              </button>
            ))}

          </div>

        </div>

      </section>

      {/* ====================================================== */}
      {/* ================= SECTION 2 ABOUT ==================== */}
      {/* ====================================================== */}

      <section className="relative min-h-screen overflow-hidden">

        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_151551_992053d1-3d3e-4b8c-abac-45f22158f411.mp4"
          autoPlay
          muted
          loop
          playsInline
        />

        <div className="relative z-10 max-w-[1831px] mx-auto px-6 md:px-12 py-24">

          <div className="flex flex-col lg:flex-row justify-between gap-16">

            {/* LEFT */}

            <div className="relative">

              <h2 className="font-grotesk uppercase text-[32px] md:text-[60px] leading-tight">

                Hello! <br />
                I'm orbis

              </h2>

              <span className="absolute bottom-0 right-0 font-condiment text-[#6FFF00] text-[36px] md:text-[68px] mix-blend-exclusion -rotate-1">

                Orbis

              </span>

            </div>

            {/* RIGHT */}

            <p className="text-[14px] md:text-[16px] uppercase max-w-[266px]">

              A digital object fixed beyond time and place.
              An exploration of distance, form,
              and silence in space.

            </p>

          </div>

        </div>

      </section>

      {/* ====================================================== */}
      {/* ================= SECTION 3 GRID ===================== */}
      {/* ====================================================== */}

      <section className="py-24">

        <div className="max-w-[1831px] mx-auto px-6 md:px-12">

          {/* HEADER */}

          <div className="flex justify-between items-end mb-16">

            <h2 className="font-grotesk uppercase text-[32px] md:text-[60px]">

              Collection of <br />

              <span className="ml-12 md:ml-24 lg:ml-32">

                <span className="font-condiment text-[#6FFF00]">
                  Space
                </span>{" "}
                objects

              </span>

            </h2>

            <button className="font-grotesk uppercase text-right">

              <div className="flex gap-2 items-end">

                <span className="text-[32px] md:text-[60px]">
                  SEE
                </span>

                <div className="flex flex-col text-[20px] md:text-[36px]">

                  <span>ALL</span>
                  <span>CREATORS</span>

                </div>

              </div>

              <div className="bg-[#6FFF00] h-[6px] md:h-[10px] w-full mt-2" />

            </button>

          </div>

          {/* GRID */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {nftVideos.map((item, i) => (

              <div
                key={i}
                className="liquid-glass rounded-[32px] p-[18px] hover:bg-white/10"
              >

                <div className="relative pb-[100%] rounded-[24px] overflow-hidden">

                  <video
                    className="absolute inset-0 w-full h-full object-cover"
                    src={item.url}
                    autoPlay
                    muted
                    loop
                    playsInline
                  />

                </div>

                {/* SCORE */}

                <div className="mt-4 liquid-glass rounded-[20px] px-5 py-4 flex justify-between items-center">

                  <div>

                    <div className="text-[11px] text-white/70">
                      RARITY SCORE:
                    </div>

                    <div className="text-[16px]">
                      {item.score}
                    </div>

                  </div>

                  <button className="w-[48px] h-[48px] rounded-full bg-gradient-to-br from-[#b724ff] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-purple-500/50 hover:scale-110 transition">

                    <ChevronRight size={18} />

                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* ====================================================== */}
      {/* ================= SECTION 4 CTA ====================== */}
      {/* ====================================================== */}

      <section className="relative">

        <video
          className="w-full h-auto block"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055729_72d66327-b59e-4ae9-bb70-de6ccb5ecdb0.mp4"
          autoPlay
          muted
          loop
          playsInline
        />

        <div className="absolute inset-0 flex items-center justify-end pr-[20%] pl-[15%]">

          <div className="relative max-w-[600px] text-right">

            <span className="absolute -top-10 left-0 font-condiment text-[#6FFF00] text-[40px] mix-blend-exclusion">

              Go beyond

            </span>

            <h2 className="font-grotesk uppercase text-[24px] md:text-[60px] leading-tight">

              <div className="mb-6">
                JOIN US.
              </div>

              REVEAL WHAT'S HIDDEN. <br />
              DEFINE WHAT'S NEXT. <br />
              FOLLOW THE SIGNAL.

            </h2>

          </div>

        </div>

      </section>

      {/* ================= LIQUID GLASS ================= */}

      <style jsx>{`

        .liquid-glass {

          background: rgba(255,255,255,0.01);

          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);

          box-shadow:
            inset 0 1px 1px rgba(255,255,255,0.1);

          position: relative;
          overflow: hidden;

        }

        .liquid-glass::before {

          content: '';

          position: absolute;
          inset: 0;

          border-radius: inherit;

          padding: 1.4px;

          background: linear-gradient(
            180deg,
            rgba(255,255,255,0.45) 0%,
            rgba(255,255,255,0.15) 20%,
            rgba(255,255,255,0) 40%,
            rgba(255,255,255,0) 60%,
            rgba(255,255,255,0.15) 80%,
            rgba(255,255,255,0.45) 100%
          );

          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);

          -webkit-mask-composite: xor;
          mask-composite: exclude;

          pointer-events: none;

        }

      `}</style>

    </div>
  );
}