import axios from 'axios';

const defaultBaseUrl =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_VIOLATIONS_BASE_URL
        ? import.meta.env.VITE_VIOLATIONS_BASE_URL
        : 'https://ums.rta.ae/violations/public-fines';

const defaultSearchPath =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_VIOLATIONS_SEARCH_PATH
        ? import.meta.env.VITE_VIOLATIONS_SEARCH_PATH
        : '/api/v1/violations/search';

const client = axios.create({
    baseURL: defaultBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

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

    const { data } = await client.post(defaultSearchPath, payload);

    return data?.data ?? data;
};

export default client;
