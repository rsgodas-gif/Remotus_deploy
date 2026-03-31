import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

const NUTRITION_IMAGE = 'https://mgx-backend-cdn.metadl.com/generate/images/1015757/2026-03-10/306e73c4-3c24-4dc0-be59-a7e9ad864349.png';

interface AccordionItemProps {
  title: string;
  emoji: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function AccordionItem({ title, emoji, children, defaultOpen = false }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl border border-[#E8E5E0] shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left active:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <h3 className="text-lg font-semibold text-[#2D3436]">{title}</h3>
        </div>
        {open ? <ChevronUp className="w-6 h-6 text-[#636E72]" /> : <ChevronDown className="w-6 h-6 text-[#636E72]" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function ListCard({ title, items, color = '#5B8A72' }: { title: string; items: string[]; color?: string }) {
  return (
    <div className="rounded-xl border border-[#E8E5E0] p-4 mb-3">
      <h4 className="text-base font-semibold mb-2" style={{ color }}>{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-base text-[#2D3436] flex items-start gap-2">
            <span className="text-[#5B8A72] mt-1">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlateSection({ title, items }: { title: string; items: { portion: string; item: string; emoji: string }[] }) {
  return (
    <div className="rounded-xl border-2 border-[#5B8A72]/30 bg-[#5B8A72]/5 p-4 mb-3">
      <h4 className="text-base font-semibold text-[#5B8A72] mb-3">{title}</h4>
      <div className="space-y-2">
        {items.map((p, i) => (
          <div key={i} className="flex items-center gap-3 bg-white rounded-lg p-3">
            <span className="text-xl">{p.emoji}</span>
            <div>
              <span className="font-semibold text-[#2D3436]">{p.portion}</span>
              <span className="text-[#636E72]"> — {p.item}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecipeCard({ title, ingredients }: { title: string; ingredients: string[] }) {
  return (
    <div className="rounded-xl border border-[#E8E5E0] p-4 mb-3 bg-[#FAFAF8]">
      <h4 className="text-base font-semibold text-[#2D3436] mb-2">{title}</h4>
      <ul className="space-y-1">
        {ingredients.map((item, i) => (
          <li key={i} className="text-sm text-[#636E72] flex items-start gap-2">
            <span className="text-[#5B8A72]">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TableRow({ cells, isHeader = false }: { cells: string[]; isHeader?: boolean }) {
  return (
    <div className={`grid grid-cols-4 gap-1 ${isHeader ? 'bg-[#5B8A72]/10' : 'bg-white'} rounded-lg p-2 mb-1`}>
      {cells.map((cell, i) => (
        <div key={i} className={`text-sm ${isHeader ? 'font-semibold text-[#5B8A72]' : 'text-[#2D3436]'} ${i === 0 ? 'col-span-1 font-medium' : ''}`}>
          {cell}
        </div>
      ))}
    </div>
  );
}

/* ==================== LEVEL 1 ==================== */
function Level1Content() {
  return (
    <div className="space-y-4">
      <div className="bg-[#5B8A72]/10 rounded-2xl p-5 border border-[#5B8A72]/20">
        <h3 className="text-base font-semibold text-[#5B8A72] mb-2">🎯 Tikslas</h3>
        <p className="text-base text-[#2D3436] leading-relaxed">
          Be didelių pokyčių sumažinti uždegimą ir pagerinti savijautą, pakeičiant tik tai, kas yra ant lėkštės.
        </p>
      </div>

      <PlateSection
        title="🍽️ Kaip turėtų atrodyti lėkštė"
        items={[
          { portion: '½ lėkštės', item: 'daržovės ir/ar vaisiai', emoji: '🥬' },
          { portion: '¼ lėkštės', item: 'liesi baltymai', emoji: '🍗' },
          { portion: '¼ lėkštės', item: 'geri angliavandeniai', emoji: '🍞' },
          { portion: '+ šaukštas', item: 'sveikų riebalų', emoji: '🫒' },
        ]}
      />

      <AccordionItem title="Ką dažniau rinktis" emoji="✅" defaultOpen>
        <ul className="space-y-2">
          {[
            '1–2 saujos daržovių prie kiekvieno valgio',
            '1–2 vaisiai per dieną',
            'Bent 1 baltymų šaltinis kiekviename valgyje',
            'Alyvuogių aliejus ar riešutai kasdien',
          ].map((item, i) => (
            <li key={i} className="text-base text-[#2D3436] flex items-start gap-2">
              <span className="text-[#5B8A72] font-bold">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </AccordionItem>

      <AccordionItem title="Ko mažinti" emoji="⛔">
        <ul className="space-y-2">
          {['Dešros ir rūkyti gaminiai', 'Keptas maistas', 'Saldumynai', 'Saldūs gėrimai'].map((item, i) => (
            <li key={i} className="text-base text-[#2D3436] flex items-start gap-2">
              <span className="text-red-400">✗</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </AccordionItem>

      <AccordionItem title="Gėrimai" emoji="💧">
        <div className="space-y-2">
          <ListCard title="Gerti daugiau" items={['Vanduo', 'Arbata', 'Kava be cukraus']} />
          <ListCard title="Riboti" items={['Saldžius gėrimus', 'Alkoholį']} color="#E8A87C" />
        </div>
      </AccordionItem>

      <AccordionItem title="Pirkinių krepšelis" emoji="🛒">
        <div className="space-y-3">
          <ListCard title="🥩 Baltymai" items={['Kiaušiniai', 'Tunas / sardinės', 'Vištiena', 'Pupelės', 'Avinžirniai', 'Lęšiai', 'Varškė / graikiškas jogurtas']} />
          <ListCard title="🌾 Geri angliavandeniai" items={['Pilno grūdo duona', 'Avižos', 'Grikiai', 'Rudieji ryžiai', 'Virtos bulvės', 'Saldžios bulvės']} />
          <ListCard title="🥕 Daržovės" items={['Pomidorai', 'Agurkai', 'Morkos', 'Salotų mišinys', 'Paprika', 'Šaldytos daržovės']} />
          <ListCard title="🍎 Vaisiai" items={['Obuoliai', 'Bananai', 'Apelsinai', 'Uogos']} />
          <ListCard title="🫒 Sveiki riebalai" items={['Alyvuogių aliejus', 'Riešutai']} />
        </div>
      </AccordionItem>
    </div>
  );
}

/* ==================== LEVEL 2 ==================== */
function Level2Content() {
  return (
    <div className="space-y-4">
      <div className="bg-[#5B8A72]/10 rounded-2xl p-5 border border-[#5B8A72]/20">
        <h3 className="text-base font-semibold text-[#5B8A72] mb-2">🎯 Tikslas</h3>
        <p className="text-base text-[#2D3436] leading-relaxed">
          Žengti žingsnį toliau – pradėti <strong>reguliariai gaminti paprastus patiekalus</strong>, kurie atitinka Viduržemio jūros mitybą.
        </p>
      </div>

      <PlateSection
        title="🍽️ Kaip turėtų atrodyti lėkštė 2?"
        items={[
          { portion: '½ lėkštės', item: 'daržovės (bent 2–3 spalvos)', emoji: '🥦' },
          { portion: '¼ lėkštės', item: 'baltymai (žuvis, vištiena, kiaušiniai, pupelės, lęšiai)', emoji: '🍗' },
          { portion: '¼ lėkštės', item: 'pilno grūdo angliavandeniai', emoji: '🌾' },
          { portion: '+ sveiki riebalai', item: 'alyvuogių aliejus, avokadas, riešutai, sėklos', emoji: '🫒' },
        ]}
      />

      <AccordionItem title="Pirkinių krepšelis (2 lygiui)" emoji="🛒" defaultOpen>
        <div className="space-y-3">
          <ListCard title="🥚 Baltymai (rinkitės 3–4)" items={[
            'Vištiena (krūtinėlė / šlaunelės)',
            'Žuvis (lašiša, menkė, skumbrė, upėtakis)',
            'Kiaušiniai',
            'Konservuotas tunas / sardinės',
            'Avinžirniai (konservuoti arba sausi)',
            'Lęšiai (raudonieji / žalieji)',
            'Pupelės (juodos, baltos, raudonos)',
          ]} />
          <ListCard title="🌾 Geri angliavandeniai (rinkitės 2–3)" items={[
            'Grikiai', 'Rudieji ryžiai', 'Avižos', 'Bulgur kruopos',
            'Bolivinė balanda', 'Pilno grūdo makaronai', 'Pilno grūdo duona',
          ]} />
          <ListCard title="🥦 Daržovės (4–6 rūšių)" items={[
            'Brokoliai', 'Cukinija', 'Morkos', 'Paprika', 'Pomidorai',
            'Agurkai', 'Svogūnas', 'Špinatai / lapiniai kopūstai', 'Šaldytų daržovių mišiniai',
          ]} />
          <ListCard title="🍎 Vaisiai (2–4)" items={[
            'Bananai', 'Obuoliai', 'Apelsinai / citrinos',
            'Uogos (šviežios arba šaldytos)', 'Kriaušės',
          ]} />
          <ListCard title="🫒 Sveiki riebalai" items={[
            'Extra virgin alyvuogių aliejus', 'Avokadai', 'Migdolai',
            'Graikiniai riešutai', 'Lazdynai', 'Chia sėklos / linų sėklos',
          ]} />
          <ListCard title="🌿 Prieskoniai & skonio pagerinimai" items={[
            'Česnakas, svogūnas', 'Bazilikas, raudonėlis, paprika, pipirai',
            'Ciberžolė', 'Citrina, laimas',
          ]} />
          <ListCard title="🍶 Pieno produktai (pasirenkamai)" items={[
            'Graikiškas jogurtas (nesaldintas)', 'Feta sūris', 'Kefyras',
          ]} />
          <ListCard title="💧 Gėrimai" items={['Vanduo', 'Arbata', 'Kava be cukraus']} />
        </div>
      </AccordionItem>

      <AccordionItem title="Patiekalų pavyzdžiai" emoji="🍱">
        <div className="space-y-2">
          <RecipeCard title="1. Vištiena su daržovėmis ir grikiais" ingredients={[
            'Kepta arba virta vištiena',
            'Troškintos daržovės (brokoliai, morkos, paprika)',
            'Grikiai',
            'Alyvuogių aliejus ant viršaus',
          ]} />
          <RecipeCard title="2. Žuvis orkaitėje" ingredients={[
            'Orkaitėje kepta žuvis (su citrina ir česnaku)',
            'Rudieji ryžiai ar kiti angliavandeniai',
            'Šviežių salotų dubenėlis (pomidorai, agurkai, salotos)',
          ]} />
          <RecipeCard title="3. Daržovių troškinys su lęšiais" ingredients={[
            'Lęšiai ar pupelės',
            'Morkos, svogūnas, pomidorai, paprika',
            'Prieskoninės žolelės + šlakelis alyvuogių aliejaus',
          ]} />
          <RecipeCard title={'4. \u201EVienos keptuvės\u201C kalakutiena su daržovėmis'} ingredients={[
            'Kalakutienos gabaliukai',
            'Cukinija + paprika + morkos (supjaustytos)',
            'Šlakelis alyvuogių aliejaus',
            'Prieskoniai: druska, pipirai, raudonėlis',
            'Viskas kepama vienoje keptuvėje — 15 min.',
          ]} />
          <RecipeCard title="5. Graikiškas dubenėlis" ingredients={[
            'Konservuoti avinžirniai',
            'Pomidorai, agurkai, paprika',
            'Šlakelis alyvuogių aliejaus + citrina',
            'Truputis fetos (nebūtina)',
          ]} />
          <RecipeCard title="6. Kiaušinienė su daržovėmis" ingredients={[
            '2–3 kiaušiniai',
            'Špinatai, pomidorai, svogūnas',
            'Alyvuogių aliejus kepimui',
          ]} />
          <RecipeCard title="7. Bolivinės balandos dubenėlis" ingredients={[
            'Išvirta bolivinė balanda',
            'Vištiena arba pupelės',
            'Brokoliai + morkos',
            'Citrinos sultys + alyvuogių aliejus',
          ]} />
        </div>
      </AccordionItem>

      <div className="bg-[#5B8A72]/10 rounded-2xl p-5 border border-[#5B8A72]/20">
        <h3 className="text-base font-semibold text-[#5B8A72] mb-2">📅 Praktinė taisyklė</h3>
        <ul className="space-y-2 text-base text-[#2D3436]">
          <li className="flex items-start gap-2">
            <span className="text-[#5B8A72] font-bold">•</span>
            <span>Gaminame <strong>1 kartą – valgome 2 kartus</strong>. Pvz., šiandien pietūs, rytoj pietūs iš tų pačių likučių.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#5B8A72] font-bold">•</span>
            <span>Bent <strong>1 pagrindinis patiekalas per dieną namuose</strong> pagal šią struktūrą.</span>
          </li>
        </ul>
        <div className="mt-3 p-3 bg-white rounded-xl">
          <p className="text-sm text-[#636E72] italic">
            🧠 Sekant šių dietos patarimų pastebėsime pirmus rimtus, apčiuopiamus, pokyčius: svorio mažėjimas, mažesni energijos svyravimai dienos eigoje, skausmo kontrolė.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ==================== LEVEL 3 ==================== */
function Level3Content() {
  return (
    <div className="space-y-4">
      <div className="bg-[#5B8A72]/10 rounded-2xl p-5 border border-[#5B8A72]/20">
        <h3 className="text-base font-semibold text-[#5B8A72] mb-2">🎯 Tikslas</h3>
        <p className="text-base text-[#2D3436] leading-relaxed">
          Sukurti <em>stabilią, sistemingą, priešuždegiminę</em> mitybą, kuri sumažina nugaros skausmą, reguliuoja svorį, gerina energiją, miegą ir nuotaiką, pagerina širdies bei žarnyno sveikatą ir tampa <strong>tvariu gyvenimo būdu</strong>, o ne laikina dieta.
        </p>
        <p className="text-sm text-[#636E72] mt-2 italic">
          Paprastai kalbant, tai yra tipinė viduržemio jūros dieta, kuri moksliniais tyrimais įrodyta kaip efektyviausia mityba uždegimo ir skausmo kontrolėje.
        </p>
      </div>

      <PlateSection
        title="🍽️ Kaip atrodo lėkštė?"
        items={[
          { portion: '½ lėkštės', item: 'daržovės ir žalumynai (špinatai, rukola, brokoliai, burokėliai)', emoji: '🥦' },
          { portion: '¼ lėkštės', item: 'aukštos kokybės baltymai (žuvis 2–4× per sav., vištiena, pupelės)', emoji: '🐟' },
          { portion: '¼ lėkštės', item: 'visaverčiai angliavandeniai (quinoa, grikiai, saldžios bulvės)', emoji: '🌾' },
          { portion: '+ sveiki riebalai', item: 'alyvuogių aliejus 1–2 šaukštai, avokadas, riešutai', emoji: '🫒' },
          { portion: '+ skonis', item: 'žolelės, citrina, česnakas (druskos minimaliai)', emoji: '🍋' },
        ]}
      />

      <AccordionItem title="Pirkinių sąrašas" emoji="🍳" defaultOpen>
        <div className="space-y-3">
          <ListCard title="🐟 Baltymai (rinkitės 4–6)" items={[
            'Lašiša', 'Skumbrė', 'Sardinės', 'Upėtakis',
            'Vištiena / kalakutiena', 'Kiaušiniai',
            'Lęšiai', 'Pupelės', 'Avinžirniai', 'Tofu (pasirenkamai)',
          ]} />
          <ListCard title="🌾 Geri angliavandeniai (rinkitės 3–4)" items={[
            'Bolivinė balanda', 'Rudieji ryžiai', 'Grikiai', 'Bulgur kruopos',
            'Saldžios bulvės', 'Avižos', 'Pilno grūdo makaronai',
          ]} />
          <ListCard title="🥦 Daržovės (7–10 rūšių)" items={[
            'Brokoliai', 'Žiediniai kopūstai', 'Špinatai', 'Cukinija', 'Baklažanas',
            'Morkos', 'Salotos / rukola', 'Paprika', 'Svogūnas, česnakas', 'Burokėliai',
          ]} />
          <ListCard title="🍎 Vaisiai (3–5)" items={[
            'Uogos (šaldytos ar šviežios)', 'Obuoliai', 'Citrusai (apelsinai, citrinos)',
            'Granatai', 'Kriaušės / kiviai',
          ]} />
          <ListCard title="🫒 Sveiki riebalai" items={[
            'Extra virgin alyvuogių aliejus', 'Avokadai',
            'Migdolai, graikiniai, pistacijos', 'Chia, linų, moliūgų sėklos',
          ]} />
          <ListCard title="🌿 Prieskoniai & skonio bazė" items={[
            'Ciberžolė', 'Imbieras', 'Raudonėlis', 'Rozmarinas',
            'Juodieji pipirai', 'Citrina / laimas', 'Bazilikas',
          ]} />
          <ListCard title="🥛 Pasirenkami produktai" items={[
            'Graikiškas jogurtas', 'Kefyras', 'Feta arba mocarela', 'Avinžirnių makaronai',
          ]} />
          <ListCard title="💧 Gėrimai" items={['Vanduo', 'Arbata (imbierinė, žolelių)', 'Kava be cukraus']} />
        </div>
      </AccordionItem>

      <AccordionItem title="Patiekalų idėjos" emoji="🥘">
        <div className="space-y-2">
          <RecipeCard title="1. Lašiša su citrina ir žolelėmis" ingredients={[
            'Lašiša orkaitėje 15 min.', 'Brokoliai garuose', 'Quinoa', 'Alyvuogių aliejus + citrina',
          ]} />
          <RecipeCard title="2. Šiltos žalios salotos su tunu" ingredients={[
            'Mišrios salotos, špinatai', 'Tunas (aukštesnės kokybės)',
            'Avokadas', 'Citrina + alyvuogių aliejus + sezamų sėklos',
          ]} />
          <RecipeCard title="3. Vištiena su burokėliais ir lapiniu kopūstu" ingredients={[
            'Kepta/virta vištiena', 'Virtas arba keptas burokėlis',
            'Lapiniai kopūstai', 'Grikiai',
          ]} />
          <RecipeCard title="4. Žuvies troškinys" ingredients={[
            'Skumbrė arba menkė', 'Pomidorai + svogūnas + česnakas',
            'Ciberžolė + kmynai', 'Saldžios bulvės',
          ]} />
          <RecipeCard title="5. Lęšių ir daržovių bowl" ingredients={[
            'Raudonieji lęšiai', 'Morkos + cukinijos + paprika', 'Citrina + alyvuogių aliejus',
          ]} />
          <RecipeCard title={'6. Salotų bokštas \u201EMediterranean\u201C'} ingredients={[
            'Rukola', 'Pomidorai', 'Alyvuogės', 'Feta', 'Avokadas', 'Alyvuogių aliejus + citrina',
          ]} />
          <RecipeCard title="7. Saldžių bulvių troškinys" ingredients={[
            'Saldžios bulvės', 'Lęšiai', 'Pomidorai', 'Imbieras + česnakas',
          ]} />
          <RecipeCard title="8. Kiaušiniai + žalios daržovės" ingredients={[
            '2–3 kiaušiniai', 'Špinatai / pomidorai / svogūnai', 'Alyvuogių aliejus',
          ]} />
          <RecipeCard title="9. Avinžirnių karis" ingredients={[
            'Avinžirniai', 'Kokosų pienas (nedaug)', 'Ciberžolė, imbieras',
            'Špinatai', 'Rudieji ryžiai',
          ]} />
          <RecipeCard title={'10. \u201ESuper žuvis\u201C orkaitėje'} ingredients={[
            'Skumbrė', 'Burokėliai + morkos', 'Ciberžolė + pipirai (anti-inflam combo)', 'Alyvuogių aliejus',
          ]} />
        </div>
      </AccordionItem>

      <AccordionItem title="Dienos maisto struktūra" emoji="📋">
        <div className="space-y-4">
          {/* Breakfast */}
          <div className="rounded-xl border border-[#E8E5E0] p-4">
            <h4 className="text-base font-semibold text-[#5B8A72] mb-2">🥣 1. Pusryčiai — lengvi, švelnūs</h4>
            <p className="text-sm text-[#636E72] mb-3">Rytais virškinimas dar miega. Sunkūs riebūs patiekalai blogina savijautą, kelia uždegimą, didina mieguistumą.</p>
            <div className="mb-2">
              <p className="text-sm font-semibold text-[#5B8A72] mb-1">✔ Ką rinktis:</p>
              <ul className="space-y-1">
                {['Lengvas baltymas: jogurtas / kiaušinis / augalinis jogurtas', 'Švelnūs angliavandeniai: avižos / vaisius', 'Sveiki riebalai: riešutai, chia, šlakelis alyvuogių aliejaus'].map((item, i) => (
                  <li key={i} className="text-sm text-[#2D3436] flex items-start gap-2">
                    <span className="text-[#5B8A72]">•</span><span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-400 mb-1">❌ Ko vengti ryte:</p>
              <ul className="space-y-1">
                {['Keptos dešrelės, blynai su cukrumi, sumuštiniai su majonezu', 'Sunkios porcijos → energijos kritimas per pietus'].map((item, i) => (
                  <li key={i} className="text-sm text-[#2D3436] flex items-start gap-2">
                    <span className="text-red-400">•</span><span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Lunch */}
          <div className="rounded-xl border border-[#E8E5E0] p-4">
            <h4 className="text-base font-semibold text-[#5B8A72] mb-2">🍽️ 2. Pietūs — pagrindinis dienos valgis</h4>
            <p className="text-sm text-[#636E72] mb-2">Gaunama daugiausia maistinių medžiagų, antioksidantų, baltymų bei sveikų riebalų.</p>
            <div className="bg-[#5B8A72]/5 rounded-lg p-3">
              <p className="text-sm font-semibold text-[#5B8A72] mb-1">Struktūra:</p>
              <ul className="space-y-1 text-sm text-[#2D3436]">
                <li>• ½ lėkštės daržovių</li>
                <li>• ¼ lėkštės baltymų</li>
                <li>• ¼ lėkštės gerų angliavandenių</li>
                <li>• Alyvuogių aliejus ant viršaus</li>
              </ul>
            </div>
          </div>

          {/* Dinner */}
          <div className="rounded-xl border border-[#E8E5E0] p-4">
            <h4 className="text-base font-semibold text-[#5B8A72] mb-2">🍲 3. Vakarienė — lengva, užbaigianti dieną</h4>
            <p className="text-sm text-[#636E72] mb-2">Vakare kūnui reikia poilsio, o ne sunkaus virškinimo.</p>
            <div className="mb-2">
              <p className="text-sm font-semibold text-[#5B8A72] mb-1">✔ Ką rinktis:</p>
              <ul className="space-y-1 text-sm text-[#2D3436]">
                {['Sriuba (lęšiai, daržovių sriuba)', 'Salotos + baltymas (kiaušinis, pupelės, tunas, vištiena)', 'Virtos/garintos daržovės', 'Minimaliai angliavandenių'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2"><span className="text-[#5B8A72]">•</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-400 mb-1">❌ Ko vengti:</p>
              <ul className="space-y-1 text-sm text-[#2D3436]">
                {['Makaronų kalnai', 'Bulvių keptuvės', 'Keptas maistas', 'Saldumynai (\u201Evakarinė cukraus bomba\u201C)'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2"><span className="text-red-400">•</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Snacks */}
          <div className="rounded-xl border border-[#E8E5E0] p-4">
            <h4 className="text-base font-semibold text-[#5B8A72] mb-2">🍏 4. Užkandžiai — pagalba, ne pagunda</h4>
            <div className="mb-2">
              <p className="text-sm font-semibold text-[#5B8A72] mb-1">✔ Geri pasirinkimai:</p>
              <ul className="space-y-1 text-sm text-[#2D3436]">
                {['Sauja riešutų', 'Vienas vaisius', 'Daržovės (pomidoras, agurkas, paprika)', 'Jogurtas (nesaldintas)'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2"><span className="text-[#5B8A72]">•</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-400 mb-1">❌ Blogi pasirinkimai:</p>
              <ul className="space-y-1 text-sm text-[#2D3436]">
                {['Bandelės', 'Saldūs batonėliai', 'Sūreliai, desertai, sausainiai'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2"><span className="text-red-400">•</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-[#5B8A72]/10 rounded-xl p-4">
            <p className="text-base text-[#5B8A72] font-medium text-center italic">
              Ryte lengvai, per pietus sočiai, vakare lengvai.
            </p>
          </div>
        </div>
      </AccordionItem>
    </div>
  );
}

/* ==================== SUPPLEMENTS ==================== */
function SupplementsContent() {
  const supplements = [
    { name: 'Vitaminas D3', dose: '2000–4000 IU per dieną (arba pagal tyrimą)', purpose: 'Imunitetui, kaulams, nuotaikai', why: 'Dauguma žmonių turi trūkumą. Mažina uždegimą, stiprina kaulus ir raumenis.' },
    { name: 'Omega-3 (žuvų taukai)', dose: '1000–2000 mg EPA+DHA per dieną', purpose: 'Sąnariams, kraujotakai', why: 'Veikia kaip natūralus priešuždegiminis. Mažina skausmą ir sustingimą.' },
    { name: 'Magnis (Mg)', dose: '200–400 mg vakare', purpose: 'Raumenims, miegui', why: 'Mažina raumenų įtampą ir spazmus, gerina miegą → mažiau nugaros skausmo ryte.' },
    { name: 'Vitaminas B12', dose: '500–1000 mcg per dieną (jei mažai arba nevartojama mėsa)', purpose: 'Energijai, nervų sistemai', why: 'Padeda nervų funkcijai, mažina dilgčiojimą, nuovargį.' },
    { name: 'Probiotikai', dose: '5–10 mlrd. CFU per dieną', purpose: 'Žarnynui ir imunitetui', why: 'Gerina virškinimą, mažina sisteminį uždegimą.' },
    { name: 'Ciberžolė (kurkuminas)', dose: '500–1000 mg per dieną', purpose: 'Uždegimui', why: 'Natūralus priešuždegiminis poveikis, mažina skausmą (kaip silpni NVNU).' },
    { name: 'Kolagenas + vitaminas C', dose: '5–10 g kolageno + 100–200 mg vit. C', purpose: 'Sąnariams, kremzlėms', why: 'Stiprina jungiamuosius audinius, gali mažinti sąnarių skausmą.' },
  ];

  return (
    <div className="space-y-4">
      {/* Why supplements matter */}
      <div className="bg-[#5B8A72]/10 rounded-2xl p-5 border border-[#5B8A72]/20">
        <h3 className="text-base font-semibold text-[#5B8A72] mb-2">
          Kodėl verta vartoti papildus esant nugaros skausmui?
        </h3>
        <p className="text-base text-[#2D3436] leading-relaxed mb-3">
          Nugaros skausmas dažniausiai kyla ne tik dėl raumenų ar diskų, taip pat kaltas ir <strong>uždegimas, raumenų įtampa, silpni kaulai ar net vitaminų trūkumas</strong>.
        </p>
        <p className="text-base text-[#2D3436] leading-relaxed mb-3">
          Maisto papildai tampa kaip <strong>maži remonto meistrai</strong>, tyliai dirbantys fone, kol jūs gyvenate savo gyvenimą.
        </p>
        <p className="text-base text-[#2D3436] leading-relaxed mb-3">
          Lietuvoje vitamino D trūkumas – beveik nacionalinis sportas, žuvies valgome tik per Kūčias, o pakankamą kiekį magnio gauti iš maisto didelis iššūkis. Todėl kūnas tiesiog neturi iš ko savęs taisyti.
        </p>
        <div className="bg-white rounded-xl p-4 border border-[#5B8A72]/20">
          <p className="text-sm text-[#5B8A72] italic">
            {'💡 Papildai padeda sumažinti uždegimą, atpalaiduoti įtemptus raumenis ir duoda kūnui \u201Estatybinių medžiagų\u201C, kad nugara pagaliau pradėtų gyti.'}
          </p>
        </div>
        <p className="text-base text-[#2D3436] leading-relaxed mt-3">
          Nereikia versti savęs gerti dešimtis tablečių. Užtenka kelių svarbiausių.
        </p>
      </div>

      {/* Top 3 */}
      <div className="bg-white rounded-2xl p-5 border-2 border-[#5B8A72]/30 shadow-sm">
        <h3 className="text-lg font-bold text-[#2D3436] mb-4">🏆 3 svarbiausi!</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-[#5B8A72]/5 rounded-xl p-4">
            <span className="text-2xl">1️⃣</span>
            <div>
              <p className="font-semibold text-[#2D3436]">Vitaminas D3</p>
              <p className="text-sm text-[#636E72]">Mažina uždegimą, stiprina kaulus ir raumenis.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-[#5B8A72]/5 rounded-xl p-4">
            <span className="text-2xl">2️⃣</span>
            <div>
              <p className="font-semibold text-[#2D3436]">Omega-3</p>
              <p className="text-sm text-[#636E72]">Natūraliai mažina skausmą ir sąnarių uždegimą.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-[#5B8A72]/5 rounded-xl p-4">
            <span className="text-2xl">3️⃣</span>
            <div>
              <p className="font-semibold text-[#2D3436]">Magnis</p>
              <p className="text-sm text-[#636E72]">Atpalaiduoja raumenis ir gerina miegą.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full supplement list */}
      <AccordionItem title="Pilnas papildų sąrašas" emoji="💊" defaultOpen>
        <div className="space-y-3">
          {supplements.map((s, i) => (
            <div key={i} className="rounded-xl border border-[#E8E5E0] p-4 bg-[#FAFAF8]">
              <h4 className="text-base font-semibold text-[#2D3436] mb-2">{s.name}</h4>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-sm font-semibold text-[#5B8A72] whitespace-nowrap">Dozė:</span>
                  <span className="text-sm text-[#2D3436]">{s.dose}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm font-semibold text-[#5B8A72] whitespace-nowrap">Kam:</span>
                  <span className="text-sm text-[#2D3436]">{s.purpose}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm font-semibold text-[#5B8A72] whitespace-nowrap">Nugarai:</span>
                  <span className="text-sm text-[#2D3436]">{s.why}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AccordionItem>
    </div>
  );
}

/* ==================== MAIN COMPONENT ==================== */
export default function Mityba() {
  const navigate = useNavigate();
  const [activeLevel, setActiveLevel] = useState<number | null>(1);

  const levels = [
    { level: 1, label: '1 lygis' },
    { level: 2, label: '2 lygis' },
    { level: 3, label: '3 lygis' },
    { level: 4, label: 'Maisto papildai' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8]" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#FAFAF8] border-b border-[#E8E5E0] px-5 py-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#5B8A72] font-medium text-lg active:opacity-70"
        >
          <ArrowLeft className="w-6 h-6" />
          Grįžti
        </button>
      </div>

      <div className="px-5 py-6 pb-10">
        <img
          src={NUTRITION_IMAGE}
          alt="Mityba"
          className="w-full h-40 object-cover rounded-2xl mb-5"
        />

        <h1 className="text-2xl font-bold text-[#2D3436] mb-1">Mityba</h1>
        <p className="text-base text-[#636E72] mb-6">
          Pasirinkite jums tinkamą mitybos lygį. Pradėkite nuo 1 lygio.
        </p>

        {/* Level tabs */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {levels.map((tab) => (
            <button
              key={tab.level}
              onClick={() => setActiveLevel(activeLevel === tab.level ? null : tab.level)}
              className={`py-3 px-4 rounded-xl text-base font-semibold transition-colors ${
                activeLevel === tab.level
                  ? 'bg-[#5B8A72] text-white'
                  : 'bg-white text-[#2D3436] border border-[#E8E5E0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeLevel === 1 && <Level1Content />}
        {activeLevel === 2 && <Level2Content />}
        {activeLevel === 3 && <Level3Content />}
        {activeLevel === 4 && <SupplementsContent />}
      </div>
    </div>
  );
}