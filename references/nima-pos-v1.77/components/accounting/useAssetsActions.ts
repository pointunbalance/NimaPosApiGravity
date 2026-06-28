import { db } from "../../db";
import { FixedAsset } from "../../types";
import { AssetFormData, ExtendedAsset } from "./AssetModal";

export const useAssetsActions = (
  editingAsset: ExtendedAsset | null,
  closeModal: () => void,
  analytics: any,
  showSuccess: (msg: string) => void,
  showError: (msg: string) => void
) => {
  const getCategoryLabel = (cat?: string) => {
    switch (cat) {
      case "electronics":
        return "أجهزة إلكترونية";
      case "furniture":
        return "أثاث ومفروشات";
      case "vehicles":
        return "سيارات ونقل";
      case "buildings":
        return "مباني وإنشاءات";
      case "tools":
        return "عدد وأدوات";
      default:
        return "معدات أخرى";
    }
  };

  const handleSave = async (data: AssetFormData) => {
    try {
      const assetData: Partial<ExtendedAsset> = {
        ...data,
        purchaseDate: new Date(data.purchaseDate),
        accumulatedDepreciation: editingAsset?.accumulatedDepreciation || 0,
      };

      if (editingAsset?.id) {
        await db.assets.update(editingAsset.id, assetData);
        showSuccess("تم تحديث بيانات الأصل الثابت بنجاح");
      } else {
        await db.assets.add(assetData as FixedAsset);
        showSuccess("تم إضافة الأصل الثابت الجديد بنجاح");
      }
      closeModal();
    } catch (e) {
      console.error(e);
      showError("حدث خطأ أثناء حفظ بيانات الأصل");
    }
  };

  const handleDeleteAsset = async (id: number) => {
    try {
      await db.assets.delete(id);
      showSuccess("تم حذف الأصل الثابت بنجاح");
    } catch (err) {
      console.error(err);
      showError("حدث خطأ أثناء حذف الأصل");
    }
  };

  const executeDepreciation = async () => {
    if (!analytics.processedAssets || analytics.processedAssets.length === 0) {
      showError("لا توجد أصول لحساب إهلاكها.");
      return;
    }

    try {
      const accounts = await db.accounts.toArray();
      const depExpenseAccount = accounts.find((a) => a.code === "5100" || a.name.includes("إهلاك"));
      const accDepAccount = accounts.find((a) => a.code === "1101" || a.name.includes("مجمع"));

      if (!depExpenseAccount || !accDepAccount) {
        showError("لم يتم العثور على حسابات الإهلاك (مصروف الإهلاك أو مجمع الإهلاك) في الدليل المحاسبي.");
        return;
      }

      let totalDepreciation = 0;
      const updatedAssets: FixedAsset[] = [];

      analytics.processedAssets.forEach((asset: any) => {
        if (asset.isFullyDepreciated) return;

        const expectedAccDep = asset.accumulated || 0;
        const currentDBAccDep = asset.accumulatedDepreciation || 0;
        const depToRun = expectedAccDep - currentDBAccDep;

        if (depToRun > 0.01) {
          totalDepreciation += depToRun;
          updatedAssets.push({
            ...asset,
            accumulatedDepreciation: currentDBAccDep + depToRun,
          });
        }
      });

      if (totalDepreciation <= 0.01) {
        showError("جميع الأصول مهلكة بالكامل أو تم إهلاكها مسبقاً لهذه الفترة.");
        return;
      }

      const AccountingEngine = (await import("../../services/AccountingEngine")).AccountingEngine;

      await db.transaction("rw", db.journalEntries, db.assets, async () => {
        await AccountingEngine.postEntry({
          date: new Date(),
          reference: `DEP-${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
          description: `إثبات إهلاك الأصول الثابتة لشهر ${new Date().getMonth() + 1}`,
          lines: [
            {
              accountId: depExpenseAccount.id!,
              debit: totalDepreciation,
              credit: 0,
              description: "مصروف إهلاك الأصول الثابتة",
            },
            {
              accountId: accDepAccount.id!,
              debit: 0,
              credit: totalDepreciation,
              description: "مجمع إهلاك الأصول الثابتة",
            },
          ],
        });

        for (const asset of updatedAssets) {
          await db.assets.update(asset.id!, {
            accumulatedDepreciation: asset.accumulatedDepreciation,
          });
        }
      });

      showSuccess("تم ترحيل قيد الإهلاك بنجاح وتحديث مجمعات الإهلاك للأصول.");
    } catch (error) {
      console.error("Error running depreciation:", error);
      showError("حدث خطأ أثناء ترحيل الإهلاك.");
    }
  };

  const handleExport = () => {
    if (!analytics.processedAssets) return;

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "اسم الأصل,الفئة,الرقم التسلسلي,تاريخ الشراء,التكلفة,الإهلاك الشهري,مجمع الإهلاك,القيمة الدفترية,الحالة\n";

    analytics.processedAssets.forEach((a: any) => {
      const status = a.isFullyDepreciated ? "مُهلك بالكامل" : "نشط";
      const cat = getCategoryLabel(a.category);
      const date = new Date(a.purchaseDate).toLocaleDateString("ar-EG");
      csvContent += `"${a.name}","${cat}","${a.serialNumber || ""}","${date}",${a.cost},${a.monthly},${a.accumulated},${a.bookValue},"${status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `assets_report_${new Date().toLocaleDateString("ar-EG")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess("تم تصدير التقرير بنجاح");
  };

  return {
    handleSave,
    handleDeleteAsset,
    executeDepreciation,
    handleExport,
  };
};
