import { useState } from "react";
import { FluentProvider, TabList, Tab, SelectTabEvent, SelectTabData } from "@fluentui/react-components";
import AssetBrandPanel from "../Components/AssetConfig/AssetBrandPanel";
import AssetVendorPanel from "../Components/AssetConfig/AssetVendorPanel";
import AssetCategoryPanel from "../Components/AssetConfig/AssetCategoryPanel";
import AssetCategoryComponentPanel from "../Components/AssetConfig/AssetCategoryComponentPanel";
import NonITFieldsPanel from "../Components/AssetConfig/NonITFieldsPanel";
import RepairRequestConfigPanel from "../Components/AssetConfig/RepairRequestConfigPanel";
import AssetConfigurationPanel from "../Components/AssetConfig/AssetConfigurationPanel";
import AssetRoleConfigPanel from "../Components/AssetConfig/AssetRoleConfigPanel";

const AssetConfiguration = () => {
  const [selectedTab, setSelectedTab] = useState<string>("vendors");

  const onTabSelect = (_: SelectTabEvent, data: SelectTabData): void => {
    setSelectedTab(data.value as string);
  };

  return (
    <FluentProvider style={{ background: "transparent" }} className="h-full">
      <TabList selectedValue={selectedTab} onTabSelect={onTabSelect}>
        <Tab value="vendors">Vendors</Tab>
        <Tab value="brands">Brands</Tab>
        <Tab value="categories">Category</Tab>
        <Tab value="categoryComponents">Category Components</Tab>
        <Tab value="nonItFields">Non-IT Fields</Tab>
        <Tab value="repairReqConfig">Repair Req Config</Tab>
        <Tab value="assetRoles">Asset Roles</Tab>
        <Tab value="configuration">Configuration</Tab>
      </TabList>

      {selectedTab === "vendors" && <AssetVendorPanel />}
      {selectedTab === "brands" && <AssetBrandPanel />}
      {selectedTab === "categories" && <AssetCategoryPanel />}
      {selectedTab === "categoryComponents" && <AssetCategoryComponentPanel />}
      {selectedTab === "nonItFields" && <NonITFieldsPanel />}
      {selectedTab === "repairReqConfig" && <RepairRequestConfigPanel />}
      {selectedTab === "assetRoles" && <AssetRoleConfigPanel />}
      {selectedTab === "configuration" && <AssetConfigurationPanel />}
    </FluentProvider>
  );
};

export default AssetConfiguration;
