/**
 * @version v2.10.53 (Final)
 * @feature Local Favorites Backup & Restore
 * @description 즐겨찾기 종목 및 그룹 데이터를 로컬 JSON 파일로 내보내고 복원하는 기능을 제공합니다.
 */

import { useState } from 'react';

interface Stock {
  name: string;
  symbol: string;
  industry?: string;
  price?: number;
  change?: number;
}

interface FavoriteGroup {
  id: string;
  name: string;
  stocks: Stock[];
}

interface BackupData {
  ungroupedStocks: Stock[];
  favoriteGroups: FavoriteGroup[];
  exportVersion: string;
  exportedAt: string;
}

export const useLocalBackup = (
  ungroupedStocks: Stock[],
  favoriteGroups: FavoriteGroup[],
  saveUngrouped: (stocks: Stock[]) => void,
  saveGroups: (groups: FavoriteGroup[]) => void,
  onSuccess: (message: string) => void
) => {
  const [isImporting, setIsImporting] = useState(false);

  const handleExportData = () => {
    const data: BackupData = {
      ungroupedStocks,
      favoriteGroups,
      exportVersion: "v2.10.53",
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-chart-puzzle-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onSuccess("백업 파일이 생성되었습니다.");
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.ungroupedStocks) saveUngrouped(data.ungroupedStocks);
        if (data.favoriteGroups) saveGroups(data.favoriteGroups);
        onSuccess("즐겨찾기 백업 데이터를 성공적으로 불러왔습니다!");
      } catch (err) {
        alert("올바르지 않은 백업 파일 형식입니다.");
        console.error("Import failed:", err);
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return {
    handleExportData,
    handleImportData,
    isImporting
  };
};
