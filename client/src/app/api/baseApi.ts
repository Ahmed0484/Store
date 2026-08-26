import { fetchBaseQuery, type BaseQueryApi, type FetchArgs } from "@reduxjs/toolkit/query/react";
import { startLoading, stopLoading } from "../layout/uiSlice";
import { toast } from "react-toastify";
import { router } from "../routes/Routes";

const customBaseQuery = fetchBaseQuery({
    baseUrl: 'https://localhost:5001/api'
});

const sleep = () => new Promise(resolve => setTimeout(resolve, 1000));

export const baseQueryWithErrorHandling = async (args: string | FetchArgs, api: BaseQueryApi,
    extraOptions: object) => {
    api.dispatch(startLoading());
    await sleep();
    const result = await customBaseQuery(args, api, extraOptions);
    api.dispatch(stopLoading());
    if (result.error) {
        const { status, data } = result.error;
        switch (status) {
            case 400:
                if (typeof data === "string")
                    toast.error(data);
                else if (typeof data === 'object' && !('errors' in (data as MultiErrors)))
                    toast.error((data as OneError).title);
                else if (typeof data === 'object' && 'errors' in (data as MultiErrors))
                    throw Object.values((data as MultiErrors).errors).flat().join(', ')
                break;
            case 401:
                toast.error((data as OneError).title);
                break;
            case 404:
                if (typeof data === 'object' && 'title' in (data as OneError))
                    router.navigate('/not-found')
                break;
            case 500:
                if (typeof data === 'object')
                    router.navigate('/server-error', {state: {error: data}})
                break;
            default:
                break;
        }
    }

    return result;
}

type OneError = { title: string }
type MultiErrors = { errors: string[] }