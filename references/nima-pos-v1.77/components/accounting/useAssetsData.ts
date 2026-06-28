import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { ExtendedAsset } from "./AssetModal";

export const useAssetsData = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [editingAsset, setEditingAsset] = useState<ExtendedAsset | null>(null);

  const assets = useLiveQuery(() => db.assets.toArray(), []) || [];

  const calculateDepreciation = (asset: ExtendedAsset) => {
    const cost = asset.cost || 0;
    const salvage = asset.salvageValue || 0;
    const lifeYears = asset.lifeInYears || 1;

    const annualDepreciation = (cost - salvage) / lifeYears;
    const monthlyDepreciation = annualDepreciation / 12;

    const purchaseDate = new Date(asset.purchaseDate);
    const today = new Date();

    const yearsDiff = today.getFullYear() - purchaseDate.getFullYear();
    const monthsDiff = today.getMonth() - purchaseDate.getMonth();
    const totalMonthsElapsed = yearsDiff * 12 + monthsDiff;

    const calculatedAccumulated = Math.min(
      monthlyDepreciation * Math.max(0, totalMonthsElapsed),
      cost - salvage
    );

    const bookValue = cost - calculatedAccumulated;
    const isFullyDepreciated = bookValue <= salvage;

    return {
      annual: annualDepreciation,
      monthly: monthlyDepreciation,
      accumulated: calculatedAccumulated,
      bookValue,
      isFullyDepreciated,
    };
  };

  const analytics = useMemo(() => {
    if (!assets)
      return {
        totalCost: 0,
        totalAccumulated: 0,
        totalBookValue: 0,
        categoryData: [],
        topAssets: [],
        processedAssets: [],
      };

    let totalCost = 0;
    let totalAccumulated = 0;
    let totalBookValue = 0;
    const catMap = new Map<string, number>();

    const processedAssets = assets.map((asset) => {
      const dep = calculateDepreciation(asset as ExtendedAsset);
      totalCost += asset.cost;
      totalAccumulated += dep.accumulated;
      totalBookValue += dep.bookValue;

      const cat = (asset as ExtendedAsset).category || "other";
      catMap.set(cat, (catMap.get(cat) || 0) + dep.bookValue);

      return { ...asset, ...dep };
    });

    const categoryData = Array.from(catMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    const topAssets = processedAssets
      .sort((a, b) => b.bookValue - a.bookValue)
      .slice(0, 5)
      .map((a) => ({
        name: a.name,
        cost: a.cost,
        value: a.bookValue,
      }));

    return {
      totalCost,
      totalAccumulated,
      totalBookValue,
      categoryData,
      topAssets,
      processedAssets,
    };
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return analytics.processedAssets?.filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.serialNumber && a.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === "all" || a.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [analytics.processedAssets, searchTerm, filterCategory]);

  return {
    isModalOpen,
    setIsModalOpen,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    editingAsset,
    setEditingAsset,
    assets,
    analytics,
    filteredAssets,
  };
};
