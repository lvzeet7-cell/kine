import { Icon, type IconName } from "@/components/ui/Icon";

const items: { icon: IconName; title: string; text: string }[] = [
  { icon: "person", title: "Prise en charge personnalisée", text: "Des séances construites à partir de votre bilan et de vos objectifs." },
  { icon: "chat", title: "Écoute et accompagnement", text: "Le temps de comprendre votre situation et de répondre à vos questions." },
  { icon: "check", title: "Approche professionnelle", text: "Des soins expliqués et un suivi attentif de votre évolution." },
  { icon: "home", title: "Cabinet à taille humaine", text: "Un cadre calme et un interlocuteur qui connaît votre parcours." },
];

export function TrustBar() {
  return (
    <section aria-label="Nos engagements" className="border-y border-line bg-surface">
      <div className="container-page">
        {/* gap-px + fond « line » = filets de séparation, quel que soit le nombre de colonnes */}
        <ul className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.title} className="flex gap-4 bg-surface py-7 sm:px-6 sm:odd:pl-0 lg:py-9 lg:odd:pl-6 lg:first:pl-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-soft text-sage-deep">
                <Icon name={item.icon} size={20} />
              </span>
              <div>
                <h2 className="text-[1rem] font-semibold leading-snug">{item.title}</h2>
                <p className="mt-1.5 text-small text-muted">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
