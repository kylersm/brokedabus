'use client';

const FAVORITE_STOPS_KEY = "favorites";

export interface FavoriteStop {
  stop: string;
  name?: string;
}

export const getFavoriteStops = (): FavoriteStop[] => {
  let needsChange = false;
  let favorites: FavoriteStop[] = [];
  const ls = localStorage.getItem(FAVORITE_STOPS_KEY);
  if(ls === null) 
    needsChange = true;
  else {
    try {
      favorites = JSON.parse(ls) as FavoriteStop[];
      if(!Array.isArray(favorites)) {
        needsChange = true;
        favorites = [];
      }
    } catch {
      needsChange = true;
    }
  }

  if(needsChange) localStorage.setItem(FAVORITE_STOPS_KEY, "[]");
  return favorites;
}

export const hasFavoriteStop = (stop: string): boolean => {
  const favorites = getFavoriteStops();
  return favorites.some(f => f.stop === stop);
}

export const addFavoriteStop = (stop: string): boolean => {
  const favorites = getFavoriteStops();
  favorites.push({ stop });
  return setFavoriteStops(favorites);
}

export const removeFavoriteStop = (stop: string): boolean => {
  return setFavoriteStops(getFavoriteStops().filter(f => f.stop !== stop));
}

/**
 * Sets the new favorite stops.
 * @param favorites list of stops to pass
 * @returns whether or not the localstorage operation was successful or not
 */
export const setFavoriteStops = (favorites: FavoriteStop[]): boolean => {
  try {
    localStorage.setItem(FAVORITE_STOPS_KEY, JSON.stringify([...new Set(favorites)]));
    return true;
  } catch {
    return false;
  }
}