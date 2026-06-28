import { useState, useDeferredValue } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Lead } from '../../types';

export const useCRMData = () => {
  const leads = useLiveQuery(() => db.leads.toArray(), []);
  const users = useLiveQuery(() => db.users.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first(), []);

  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [assignedUserFilter, setAssignedUserFilter] = useState<number | 'all'>('all');

  const filteredLeads = leads?.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
                          lead.company?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
                          lead.phone?.includes(deferredSearch);
    const matchesUser = assignedUserFilter === 'all' || lead.assignedTo === assignedUserFilter;
    return matchesSearch && matchesUser;
  }) || [];

  const pipelineValue = leads?.filter(l => l.status !== 'lost' && l.status !== 'won').reduce((sum, l) => sum + (l.value || 0), 0) || 0;
  const wonValue = leads?.filter(l => l.status === 'won').reduce((sum, l) => sum + (l.value || 0), 0) || 0;
  const totalClosed = leads?.filter(l => l.status === 'won' || l.status === 'lost').length || 0;
  const wonCount = leads?.filter(l => l.status === 'won').length || 0;
  const winRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;
  const activeLeadsCount = leads?.filter(l => l.status !== 'lost' && l.status !== 'won').length || 0;

  const currencyCode = settings?.currencyCode || 'EGP';

  return {
    leads,
    users,
    settings,
    searchTerm,
    setSearchTerm,
    assignedUserFilter,
    setAssignedUserFilter,
    filteredLeads,
    pipelineValue,
    wonValue,
    winRate,
    activeLeadsCount,
    currencyCode
  };
};
