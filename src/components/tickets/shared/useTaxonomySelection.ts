/**
 * /src/components/tickets/shared/useTaxonomySelection.ts
 *
 * Hook for managing taxonomy selection state: action → category → object → detail.
 * Extracts the duplicated selection logic from both ticket forms.
 */
import { useState, useMemo, useCallback } from 'react';
import type { TaxAction, TaxCategory, TaxObject, TaxDetail } from '@/types';

export interface TaxonomySelectionState {
  actionId: string;
  actionKey: string;
  actionLabel: string;
  categoryId: string;
  categoryLabel: string;
  objectId: string;
  objectLabel: string;
  detailId: string;
  detailLabel: string;
  urgency: number;
  initiality: 'initial' | 'relance';
  relanceCode: string;
  showFreeCategory: boolean;
  freeCategory: string;
  showFreeObject: boolean;
  freeObject: string;
}

export interface TaxonomySelectionActions {
  selectAction: (action: TaxAction) => void;
  selectCategory: (id: string, categories: TaxCategory[]) => void;
  selectObject: (id: string, objects: TaxObject[]) => void;
  selectDetail: (id: string, details: TaxDetail[]) => void;
  setInitiality: (val: 'initial' | 'relance') => void;
  setRelanceCode: (val: string) => void;
  setUrgency: (val: number) => void;
  setShowFreeCategory: (val: boolean) => void;
  setFreeCategory: (val: string) => void;
  setShowFreeObject: (val: boolean) => void;
  setFreeObject: (val: string) => void;
  enableFreeCategory: () => void;
  disableFreeCategory: () => void;
  enableFreeObject: () => void;
  disableFreeObject: () => void;
  buildTitle: () => string;
}

export function useTaxonomySelection(): TaxonomySelectionState & TaxonomySelectionActions {
  const [actionId, setActionId] = useState('');
  const [actionKey, setActionKey] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('');
  const [objectId, setObjectId] = useState('');
  const [objectLabel, setObjectLabel] = useState('');
  const [detailId, setDetailId] = useState('');
  const [detailLabel, setDetailLabel] = useState('');
  const [urgency, setUrgency] = useState(2);
  const [initiality, setInitiality] = useState<'initial' | 'relance'>('initial');
  const [relanceCode, setRelanceCode] = useState('');
  const [showFreeCategory, setShowFreeCategory] = useState(false);
  const [freeCategory, setFreeCategory] = useState('');
  const [showFreeObject, setShowFreeObject] = useState(false);
  const [freeObject, setFreeObject] = useState('');

  const resetFromCategory = useCallback(() => {
    setCategoryId('');
    setCategoryLabel('');
    setShowFreeCategory(false);
    setFreeCategory('');
    setObjectId('');
    setObjectLabel('');
    setShowFreeObject(false);
    setFreeObject('');
    setDetailId('');
    setDetailLabel('');
    setUrgency(2);
  }, []);

  const resetFromObject = useCallback(() => {
    setObjectId('');
    setObjectLabel('');
    setShowFreeObject(false);
    setFreeObject('');
    setDetailId('');
    setDetailLabel('');
    setUrgency(2);
  }, []);

  const selectAction = useCallback(
    (a: TaxAction) => {
      setActionId(a.id);
      setActionKey(a.key);
      setActionLabel(a.label);
      resetFromCategory();
    },
    [resetFromCategory],
  );

  const selectCategory = useCallback(
    (id: string, categories: TaxCategory[]) => {
      const cat = categories.find((c) => c.id === id);
      setCategoryId(id);
      setCategoryLabel(cat?.label || '');
      setShowFreeCategory(false);
      setFreeCategory('');
      resetFromObject();
    },
    [resetFromObject],
  );

  const selectObject = useCallback((id: string, objects: TaxObject[]) => {
    if (id === '__other__') {
      setObjectId('');
      setObjectLabel('');
      setShowFreeObject(true);
      setFreeObject('');
      setDetailId('');
      setDetailLabel('');
      return;
    }
    setShowFreeObject(false);
    setFreeObject('');
    const obj = objects.find((o) => o.id === id);
    setObjectId(id);
    setObjectLabel(obj?.label || '');
    setDetailId('');
    setDetailLabel('');
    if (obj?.urgency_level) setUrgency(obj.urgency_level);
  }, []);

  const selectDetail = useCallback((id: string, details: TaxDetail[]) => {
    const det = details.find((d) => d.id === id);
    setDetailId(id);
    setDetailLabel(det?.label || '');
  }, []);

  const enableFreeCategory = useCallback(() => {
    setShowFreeCategory(true);
    setCategoryId('');
    setCategoryLabel('');
  }, []);

  const disableFreeCategory = useCallback(() => {
    setShowFreeCategory(false);
    setFreeCategory('');
  }, []);

  const enableFreeObject = useCallback(() => {
    setShowFreeObject(true);
    setObjectId('');
    setObjectLabel('');
  }, []);

  const disableFreeObject = useCallback(() => {
    setShowFreeObject(false);
    setFreeObject('');
  }, []);

  const buildTitle = useCallback(() => {
    const catDisplay = showFreeCategory ? freeCategory : categoryLabel;
    const objDisplay = showFreeObject ? freeObject : objectLabel;

    if (initiality === 'relance' && relanceCode) {
      return `relance ${actionLabel} #${relanceCode} — ${catDisplay} > ${objDisplay}`;
    }

    const parts = [catDisplay, objDisplay];
    if (detailLabel) parts.push(detailLabel);
    return parts
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .join(' — ');
  }, [
    initiality, relanceCode, actionLabel, categoryLabel, objectLabel,
    freeCategory, freeObject, showFreeCategory, showFreeObject, detailLabel,
  ]);

  return {
    // State
    actionId, actionKey, actionLabel,
    categoryId, categoryLabel,
    objectId, objectLabel,
    detailId, detailLabel,
    urgency, initiality, relanceCode,
    showFreeCategory, freeCategory,
    showFreeObject, freeObject,
    // Actions
    selectAction, selectCategory, selectObject, selectDetail,
    setInitiality, setRelanceCode, setUrgency,
    setShowFreeCategory, setFreeCategory,
    setShowFreeObject, setFreeObject,
    enableFreeCategory, disableFreeCategory,
    enableFreeObject, disableFreeObject,
    buildTitle,
  };
}
