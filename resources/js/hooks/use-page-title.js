import { useEffect, useRef } from 'react';

export default function usePageTitle(title, options = {}) {
    const previousTitleRef = useRef(typeof document !== 'undefined' ? document.title : '');
    const { prefix = 'Car Fleet OS' } = options;

    useEffect(() => {
        if (!title || typeof document === 'undefined') {
            return undefined;
        }

        const composedTitle = prefix ? `${title} | ${prefix}` : title;
        document.title = composedTitle;

        return () => {
            document.title = previousTitleRef.current || prefix || title;
        };
    }, [prefix, title]);
}
