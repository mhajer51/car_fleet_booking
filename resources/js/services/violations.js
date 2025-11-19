import http from '../api/http.js';

export const searchViolationsByPlate = async ({
    plateNumber,
    plateSource,
    plateCategory,
    plateCode,
    language = 'en',
}) => {
    const payload = {
        plateNumber,
        plateSource,
        plateCategory,
        plateCode,
        searchBy: 'PlateDetails',
        language,
    };

    const { data } = await http.post('/admin/violations/search', payload);

    return data?.data ?? data;
};

export default http;
