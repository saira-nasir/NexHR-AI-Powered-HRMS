import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export const useHasPermission = (codename: string): boolean => {
    const permissions = useSelector((state: RootState) => state.auth.permissions);

    // Optional: Global admin bypass if needed. 
    // For now, we assume ALL permissions are explicit in the list.
    return permissions.includes(codename);
};
