import { useState, useEffect } from 'react';
import { categoryService } from '../services/services';

export function useCategories(type) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        categoryService.getAll(type)
            .then((res) => { if (active) setCategories(res.data.categories); })
            .catch(() => { if (active) setCategories([]); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [type]);

    return { categories, loading };
}
