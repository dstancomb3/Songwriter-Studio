export type PronunciationEntry = {
  word: string;
  vowel: string;
  coda: string;
  rhyme: string;
  syllables: number;
};

type FamilyDefinition = {
  vowel: string;
  coda: string;
  words: string[];
};

const families:
  FamilyDefinition[] = [
    { vowel: "AY", coda: "T", words: ["bright","fight","flight","light","might","night","right","sight","tight","white"] },
    { vowel: "EY", coda: "", words: ["day","gray","lay","may","pay","play","say","stay","way"] },
    { vowel: "AY", coda: "M", words: ["climb","crime","lime","rhyme","time"] },
    { vowel: "AY", coda: "N", words: ["fine","line","mine","sign","shine","wine"] },
    { vowel: "OW", coda: "M", words: ["home","roam"] },
    { vowel: "OW", coda: "N", words: ["alone","bone","known","phone","stone","tone"] },
    { vowel: "AH", coda: "V", words: ["above","dove","glove","love","shove"] },
    { vowel: "AA", coda: "RT", words: ["art","heart","part","start"] },
    { vowel: "AA", coda: "R", words: ["bar","car","far","scar","star"] },
    { vowel: "AA", coda: "RK", words: ["dark","mark","park","spark"] },
    { vowel: "IH", coda: "S", words: ["bliss","kiss","miss","this"] },
    { vowel: "EH", coda: "D", words: ["bed","dead","head","red","said"] },
    { vowel: "IY", coda: "", words: ["be","free","me","see","three","tree"] },
    { vowel: "IY", coda: "P", words: ["deep","keep","sleep","weep"] },
    { vowel: "IY", coda: "M", words: ["dream","seam","stream","team"] },
    { vowel: "IY", coda: "N", words: ["clean","green","mean","seen"] },
    { vowel: "ER", coda: "N", words: ["burn","learn","return","turn"] },
    { vowel: "ER", coda: "D", words: ["heard","word"] },
    { vowel: "ER", coda: "LD", words: ["world"] },
    { vowel: "AW", coda: "ND", words: ["around","bound","found","ground","sound"] },
    { vowel: "AW", coda: "T", words: ["about","doubt","out","shout"] },
    { vowel: "AW", coda: "N", words: ["down","drown","town"] },
    { vowel: "EY", coda: "N", words: ["again","chain","gain","pain","rain","train"] },
    { vowel: "EY", coda: "M", words: ["blame","flame","game","name","same"] },
    { vowel: "EY", coda: "K", words: ["break","fake","make","shake","take","wake"] },
    { vowel: "EY", coda: "S", words: ["face","grace","place","race","space"] },
    { vowel: "IH", coda: "R", words: ["clear","fear","hear","near","tear"] },
    { vowel: "EH", coda: "R", words: ["air","bare","care","fair","share","there","where"] },
    { vowel: "AO", coda: "R", words: ["door","floor","more","shore"] },
    { vowel: "AO", coda: "L", words: ["call","fall","hall","small","wall"] },
    { vowel: "AO", coda: "NG", words: ["long","song","strong","wrong"] },
    { vowel: "AE", coda: "K", words: ["back","black","crack","track"] },
    { vowel: "AE", coda: "D", words: ["bad","glad","had","mad","sad"] },
    { vowel: "AE", coda: "N", words: ["can","man","plan","ran"] },
    { vowel: "AE", coda: "ST", words: ["fast","last","past"] },
    { vowel: "UH", coda: "D", words: ["could","good","should","would"] },
    { vowel: "UW", coda: "", words: ["blue","do","new","through","true","you"] },
    { vowel: "UW", coda: "N", words: ["moon","soon","tune"] },
    { vowel: "UW", coda: "M", words: ["bloom","room"] },
    { vowel: "EH", coda: "ND", words: ["bend","end","friend","send"] },
    { vowel: "EH", coda: "L", words: ["hell","sell","tell","well"] },
    { vowel: "EH", coda: "FT", words: ["left"] },
    { vowel: "IH", coda: "V", words: ["give","live"] },
    { vowel: "IH", coda: "T", words: ["bit","fit","hit","sit"] },
    { vowel: "IH", coda: "D", words: ["did","hid","kid"] },
    { vowel: "IH", coda: "NG", words: ["bring","sing","spring","thing","wing"] },
    { vowel: "EH", coda: "K", words: ["check","neck","wreck"] },
    { vowel: "OW", coda: "", words: ["go","know","show","slow"] },
    { vowel: "OW", coda: "LD", words: ["cold","hold","old","told"] },
    { vowel: "OW", coda: "ST", words: ["ghost","most"] },
    { vowel: "AY", coda: "D", words: ["hide","ride","side","wide"] },
    { vowel: "AY", coda: "F", words: ["life","knife","strife","wife"] },
    { vowel: "AY", coda: "R", words: ["fire","higher","liar","wire"] },
    { vowel: "IY", coda: "V", words: ["believe","leave","receive","weave"] },
    { vowel: "IY", coda: "L", words: ["feel","heal","real","steel"] },
    { vowel: "AO", coda: "R", words: ["core","more","shore","store"] },
    { vowel: "AH", coda: "N", words: ["done","one","run","sun"] },
    { vowel: "AH", coda: "M", words: ["come","drum","from","some"] },
    { vowel: "AH", coda: "ST", words: ["dust","must","trust"] },
    { vowel: "AH", coda: "S", words: ["us"] },
    { vowel: "AO", coda: "ST", words: ["cost","lost"] },
    { vowel: "AO", coda: "F", words: ["off","soft"] },
    { vowel: "OY", coda: "", words: ["boy","joy"] },
    { vowel: "OY", coda: "S", words: ["choice","voice"] },
    { vowel: "EY", coda: "T", words: ["date","fate","great","late","wait"] },
    { vowel: "EY", coda: "V", words: ["brave","save","wave"] },
    { vowel: "EY", coda: "D", words: ["fade","made","shade"] },
    { vowel: "AH", coda: "R", words: ["blur","her"] },
    { vowel: "ER", coda: "", words: ["her"] },
  ];

const entries =
  families.flatMap(
    (family) =>
      family.words.map(
        (word) => ({
          word,
          vowel:
            family.vowel,
          coda:
            family.coda,
          rhyme:
            family.vowel +
            ":" +
            family.coda,
          syllables:
            1,
        })
      )
  );

const overrides:
  PronunciationEntry[] = [
    { word: "away", vowel: "EY", coda: "", rhyme: "EY:", syllables: 2 },
    { word: "today", vowel: "EY", coda: "", rhyme: "EY:", syllables: 2 },
    { word: "tonight", vowel: "AY", coda: "T", rhyme: "AY:T", syllables: 2 },
    { word: "alive", vowel: "AY", coda: "V", rhyme: "AY:V", syllables: 2 },
    { word: "desire", vowel: "AY", coda: "R", rhyme: "AY:R", syllables: 2 },
    { word: "inside", vowel: "AY", coda: "D", rhyme: "AY:D", syllables: 2 },
    { word: "goodbye", vowel: "AY", coda: "", rhyme: "AY:", syllables: 2 },
    { word: "maybe", vowel: "IY", coda: "", rhyme: "IY:", syllables: 2 },
    { word: "memory", vowel: "IY", coda: "", rhyme: "IY:", syllables: 3 },
    { word: "anymore", vowel: "AO", coda: "R", rhyme: "AO:R", syllables: 3 },
  ];

const map =
  new Map<
    string,
    PronunciationEntry
  >();

for (
  const entry
  of [
    ...entries,
    ...overrides,
  ]
) {
  map.set(
    entry.word,
    entry
  );
}

export function getPronunciation(
  word: string
) {
  return (
    map.get(
      word
        .toLowerCase()
        .replace(
          /[^a-z]/g,
          ""
        )
    ) ?? null
  );
}

export function getPronunciationVocabulary() {
  return Array.from(
    map.values()
  );
}
