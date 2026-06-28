import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useLocation } from 'react-router-dom';
import { db } from '../../db';

export const useGeneralLedgerData = () => {
  const location = useLocation();

  // State
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('');
  const [selectedCostCenterId, setSelectedCostCenterId] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
    end: new Date().toISOString().split('T')[0],
  });
  const [showChart, setShowChart] = useState(true);

  // Modal State for Drill-down
  const [viewEntry, setViewEntry] = useState<any>(null);

  // Load Data
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const costCenters = useLiveQuery(() => db.costCenters.toArray(), []);
  const journals = useLiveQuery(() => db.journalEntries.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first());

  // Handle Navigation State (Pre-select account)
  useEffect(() => {
    if (location.state && location.state.accountId && accounts) {
      setSelectedAccountId(location.state.accountId);
    }
  }, [location.state, accounts]);

  const selectedAccount = useMemo(() => {
    return accounts?.find((a) => a.id === Number(selectedAccountId));
  }, [accounts, selectedAccountId]);

  // --- Logic ---
  const ledgerData = useMemo(() => {
    if (!selectedAccountId || !journals || !selectedAccount) return null;

    const startDate = new Date(dateRange.start).setHours(0, 0, 0, 0);
    const endDate = new Date(dateRange.end).setHours(23, 59, 59, 999);

    let openingBalance = 0;
    const movements: any[] = [];

    // Determine "Normal Balance" side
    const isDebitNormal = ['asset', 'expense'].includes(selectedAccount.type);

    // Sort journals chronologically
    const sortedJournals = [...journals].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedJournals.forEach((entry) => {
      // Find lines affecting this account and optionally cost center
      const lines = entry.lines.filter((l) => {
        if (l.accountId !== Number(selectedAccountId)) return false;
        if (
          selectedCostCenterId &&
          l.costCenterId !== Number(selectedCostCenterId)
        )
          return false;
        return true;
      });

      if (lines.length === 0) return;

      const entryTime = new Date(entry.date).getTime();

      // Calculate net amount for this entry on this account
      const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);

      let netChange = 0;
      if (isDebitNormal) {
        netChange = totalDebit - totalCredit;
      } else {
        netChange = totalCredit - totalDebit;
      }

      if (entryTime < startDate) {
        openingBalance += netChange;
      } else if (entryTime <= endDate) {
        // Apply Text Filter
        if (
          searchTerm &&
          !entry.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !entry.reference?.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return;
        }

        movements.push({
          id: entry.id,
          date: entry.date,
          description: entry.description,
          reference: entry.reference,
          debit: totalDebit,
          credit: totalCredit,
          netChange: netChange,
          originalEntry: entry,
        });
      }
    });

    // Calculate Running Balance
    let running = openingBalance;
    const movementsWithBalance = movements.map((m) => {
      running += m.netChange;
      return { ...m, balance: running };
    });

    const periodDebit = movements.reduce((sum, m) => sum + m.debit, 0);
    const periodCredit = movements.reduce((sum, m) => sum + m.credit, 0);

    return {
      openingBalance,
      movements: movementsWithBalance,
      periodDebit,
      periodCredit,
      closingBalance: running,
      isDebitNormal,
    };
  }, [
    journals,
    selectedAccountId,
    selectedCostCenterId,
    selectedAccount,
    dateRange,
    searchTerm,
  ]);

  const chartData = useMemo(() => {
    if (!ledgerData) return [];

    const data = [
      {
        date: new Date(dateRange.start).toLocaleDateString('ar-IQ', {
          month: 'short',
          day: 'numeric',
        }),
        balance: Math.abs(ledgerData.openingBalance),
        rawBalance: ledgerData.openingBalance,
        name: 'رصيد افتتاحي',
      },
    ];

    ledgerData.movements.forEach((m) => {
      data.push({
        date: new Date(m.date).toLocaleDateString('ar-IQ', {
          month: 'short',
          day: 'numeric',
        }),
        balance: Math.abs(m.balance),
        rawBalance: m.balance,
        name:
          m.description.substring(0, 20) +
          (m.description.length > 20 ? '...' : ''),
      });
    });

    return data;
  }, [ledgerData, dateRange.start]);

  const handleExportCSV = () => {
    if (!ledgerData || !selectedAccount) return;

    const headers = [
      'Date',
      'Ref',
      'Description',
      'Debit',
      'Credit',
      'Balance',
    ];

    // Opening Row
    const openingRow = [
      dateRange.start,
      '-',
      'Opening Balance',
      '-',
      '-',
      ledgerData.openingBalance,
    ];

    const rows = ledgerData.movements.map((m) => [
      new Date(m.date).toLocaleDateString(),
      m.reference || '',
      m.description,
      m.debit,
      m.credit,
      m.balance,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [
        headers.join(','),
        openingRow.join(','),
        ...rows.map((r) => r.join(',')),
      ].join('\n');

    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Ledger_${selectedAccount.code}_${dateRange.start}.csv`;
    link.click();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const setQuickDate = (type: 'today' | 'month' | 'year' | 'all') => {
    const d = new Date();
    switch (type) {
      case 'today': {
        const today = d.toISOString().split('T')[0];
        setDateRange({ start: today, end: today });
        break;
      }
      case 'month': {
        setDateRange({
          start: new Date(d.getFullYear(), d.getMonth(), 1)
            .toISOString()
            .split('T')[0],
          end: new Date(d.getFullYear(), d.getMonth() + 1, 0)
            .toISOString()
            .split('T')[0],
        });
        break;
      }
      case 'year': {
        setDateRange({
          start: new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0],
          end: new Date(d.getFullYear(), 11, 31).toISOString().split('T')[0],
        });
        break;
      }
      case 'all': {
        setDateRange({ start: '2000-01-01', end: '2100-12-31' });
        break;
      }
    }
  };

  return {
    selectedAccountId,
    setSelectedAccountId,
    selectedCostCenterId,
    setSelectedCostCenterId,
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateRange,
    showChart,
    setShowChart,
    viewEntry,
    setViewEntry,
    accounts,
    costCenters,
    selectedAccount,
    ledgerData,
    chartData,
    settings,
    handleExportCSV,
    formatCurrency,
    setQuickDate,
  };
};
