import { useEffect } from "react";

import { useSongStore } from "./store/songStore";
import { sampleSong } from "./data/sampleSong";

import { SectionPanel } from "./components/sections/SectionPanel";
import { SectionEditor } from "./components/sections/SectionEditor";
import { ArrangementPanel } from "./components/arrangement/ArrangementPanel";
import { PreviewPanel } from "./components/preview/PreviewPanel";

function App() {
const setCurrentSong = useSongStore(
(state) => state.setCurrentSong
);

useEffect(() => {
setCurrentSong(sampleSong);
}, [setCurrentSong]);

return (
<div
style={{
display: "grid",
gridTemplateColumns:
"250px 1fr 250px 2fr",
gap: "1rem",
padding: "1rem",
minHeight: "100vh",
}}
> <SectionPanel />


  <SectionEditor />

  <ArrangementPanel />

  <PreviewPanel />
</div>


);
}

export default App;
