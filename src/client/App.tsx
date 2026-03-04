import TabBar, {TABS} from "./components/TabBar";
import Footer from "./components/Footer";
import {useEffect, useState} from "react";
import Dashboard from "./components/Dashboard";
import DataEntry from "./components/DataEntry";
import Admissions from "./components/admissions/Admissions";
import EnrollAttrition from "./components/EnrollAttrition/EnrollAttrition";
import Personnel from "./components/personnel/Personnel";

function App() {
    const [tabsActive, setTabsActive] = useState<boolean[]>([]);
    useEffect(() => {
        const defaultTabs:boolean[] = [];
        Object.values(TABS).forEach(v => defaultTabs.push(false));
        defaultTabs[0] = true;
        setTabsActive(defaultTabs);

    }, [])

  return (
      <div className="h-screen flex flex-col">
          <TabBar tabStatuses={tabsActive} setTabStatuses={setTabsActive} />
              <div className="bg-[#F2F2F2] flex-1">
                  {tabsActive[0] && <Dashboard />}
                  {tabsActive[1] && <DataEntry />}
                  {tabsActive[2] && <Admissions />}
                  {tabsActive[3] && <EnrollAttrition />}
                  {tabsActive[4] && <Personnel />}
              </div>
      </div>
  );
}

export default App;