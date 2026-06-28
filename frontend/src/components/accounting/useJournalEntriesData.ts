import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

export const useJournalEntriesData = () => {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'posted' | 'draft'>('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const costCenters = useLiveQuery(() => db.costCenters.toArray(), []);
  const fiscalYears = useLiveQuery(() => db.fiscalYears.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first());

  const journals = useLiveQuery(async () => {
    const all = await db.journalEntries.toArray();
    return all.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, []);

  const filteredJournals = useMemo(() => {
    if (!journals) return [];
    return journals.filter((j) => {
      const matchesSearch =
        j.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (j.reference &&
          j.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
        j.id?.toString().includes(searchTerm);

      const matchesStatus = statusFilter === 'all' || j.status === statusFilter;

      const jDate = new Date(j.date).setHours(0, 0, 0, 0);
      const startDate = new Date(dateRange.start).setHours(0, 0, 0, 0);
      const endDate = new Date(dateRange.end).setHours(23, 59, 59, 999);
      const matchesDate = jDate >= startDate && jDate <= endDate;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [journals, searchTerm, statusFilter, dateRange]);

  const isDateClosed = (dateStr: string | Date) => {
    if (!fiscalYears) return false;
    const d = new Date(dateStr).getTime();
    return fiscalYears.some((fy) => {
      const start = new Date(fy.startDate).setHours(0, 0, 0, 0);
      const end = new Date(fy.endDate).setHours(23, 59, 59, 999);
      return d >= start && d <= end && fy.status === 'closed';
    });
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

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US').format(val);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    dateRange,
    setDateRange,
    accounts,
    costCenters,
    fiscalYears,
    journals,
    settings,
    filteredJournals,
    isDateClosed,
    setQuickDate,
    formatCurrency,
  };
};
