import { useState, useEffect, useRef } from 'react';

interface RecommendationTransitionResult {
  isUpdating: boolean;
  updateNotice: string | null;
}

export function useRecommendationTransition(
  providerId?: string,
  netRecipient?: number,
  isRtl: boolean = false
): RecommendationTransitionResult {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateNotice, setUpdateNotice] = useState<string | null>(null);

  const prevProviderRef = useRef<string | undefined>(providerId);
  const prevNetRef = useRef<number | undefined>(netRecipient);

  useEffect(() => {
    const prevProvider = prevProviderRef.current;
    const prevNet = prevNetRef.current;

    if (prevProvider !== undefined && providerId !== undefined) {
      if (prevProvider !== providerId) {
        setIsUpdating(true);
        setUpdateNotice(
          isRtl
            ? 'تم اكتشاف خيار جديد أعلى قيمة'
            : 'New stronger provider recommendation detected'
        );

        const timer = setTimeout(() => {
          setIsUpdating(false);
          setUpdateNotice(null);
        }, 2000);

        prevProviderRef.current = providerId;
        prevNetRef.current = netRecipient;
        return () => clearTimeout(timer);
      } else if (prevNet !== undefined && netRecipient !== undefined && Math.abs(prevNet - netRecipient) > 0.5) {
        setIsUpdating(true);
        setUpdateNotice(
          isRtl
            ? 'تم تحديث أرقام الاستلام بناءً على سعر مؤكد جديد'
            : 'Payout updated after verified rate refresh'
        );

        const timer = setTimeout(() => {
          setIsUpdating(false);
          setUpdateNotice(null);
        }, 2000);

        prevProviderRef.current = providerId;
        prevNetRef.current = netRecipient;
        return () => clearTimeout(timer);
      }
    }

    prevProviderRef.current = providerId;
    prevNetRef.current = netRecipient;
  }, [providerId, netRecipient, isRtl]);

  return { isUpdating, updateNotice };
}
