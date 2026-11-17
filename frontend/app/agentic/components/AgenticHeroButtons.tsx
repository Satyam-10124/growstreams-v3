"use client";

export default function AgenticHeroButtons() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={"links"}>
      <a
        className={"btn bg-green-font-black"}
        href="#learn"
        onClick={(e) => { e.preventDefault(); scrollTo('learn'); }}
      >
        {"		Start Learning\n		"}
      </a>
      <a
        className={"btn btn-border"}
        href="#earn"
        onClick={(e) => { e.preventDefault(); scrollTo('earn'); }}
      >
        {"		Earn Bounties\n		"}
      </a>
    </div>
  );
}
