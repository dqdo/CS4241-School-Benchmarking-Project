
import TabBar, {TABS} from "./components/TabBar";
import Footer from "./components/Footer";
import {useEffect, useState} from "react";
import Dashboard from "./components/Dashboard";
import DataEntry from "./components/DataEntry";

function App() {
    const [tabsActive, setTabsActive] = useState<boolean[]>([]);
    useEffect(() => {
        const defaultTabs:boolean[] = [];
        Object.values(TABS).forEach(v => defaultTabs.push(false));
        defaultTabs[0] = true;
        setTabsActive(defaultTabs);

        fetch("/belongsToSchool").then(data => data.json()).then(d => console.log(d));

    }, [])

/*
    ================================ Adding Tabs ==================================
    Add new line {tabsActive[n] && <YourNewTab />}
    In TabBar add the name of your tab to the TABS array.
    Make sure the order of the names in TABS is the same as the order in this file
    ==============================================================================
 */

  return (
      <div className="h-screen flex flex-col">
          <TabBar tabStatuses={tabsActive} setTabStatuses={setTabsActive} />
              <div className="bg-[#F2F2F2] flex-1">
                  {tabsActive[0] && <Dashboard />}
                  {tabsActive[1] && <DataEntry />}
              </div>
      </div>
  );
}

export default App;
