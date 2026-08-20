import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getFavoriteRecords, setFavorite, type PlaceIdentity } from "../lib/community";
import { useAuth } from "./AuthContext";

interface FavoritesContextValue {
  favorites: Set<string>;
  favoriteRecords: PlaceIdentity[];
  loading: boolean;
  isFavorite: (placeKey: string) => boolean;
  toggleFavorite: (identity: PlaceIdentity) => Promise<boolean>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoriteRecords, setFavoriteRecords] = useState<PlaceIdentity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!profile) {
      setFavorites(new Set());
      setFavoriteRecords([]);
      return;
    }
    setLoading(true);
    void getFavoriteRecords(profile.id)
      .then((next) => {
        if (active) {
          setFavoriteRecords(next);
          setFavorites(new Set(next.map((favorite) => favorite.placeKey)));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [profile]);

  const isFavorite = useCallback((placeKey: string) => favorites.has(placeKey), [favorites]);

  const toggleFavorite = useCallback(
    async (identity: PlaceIdentity) => {
      if (!profile) throw new Error("LOGIN_REQUIRED");
      const nextSaved = !favorites.has(identity.placeKey);
      setFavorites((current) => {
        const next = new Set(current);
        if (nextSaved) next.add(identity.placeKey);
        else next.delete(identity.placeKey);
        return next;
      });
      setFavoriteRecords((current) =>
        nextSaved
          ? [...current.filter((favorite) => favorite.placeKey !== identity.placeKey), identity]
          : current.filter((favorite) => favorite.placeKey !== identity.placeKey),
      );
      try {
        await setFavorite(profile.id, identity, nextSaved);
        return nextSaved;
      } catch (error) {
        setFavorites((current) => {
          const rollback = new Set(current);
          if (nextSaved) rollback.delete(identity.placeKey);
          else rollback.add(identity.placeKey);
          return rollback;
        });
        setFavoriteRecords((current) =>
          nextSaved
            ? current.filter((favorite) => favorite.placeKey !== identity.placeKey)
            : [...current.filter((favorite) => favorite.placeKey !== identity.placeKey), identity],
        );
        throw error;
      }
    },
    [favorites, profile],
  );

  const value = useMemo(
    () => ({ favorites, favoriteRecords, loading, isFavorite, toggleFavorite }),
    [favorites, favoriteRecords, loading, isFavorite, toggleFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error("useFavorites must be used inside FavoritesProvider.");
  return value;
}
