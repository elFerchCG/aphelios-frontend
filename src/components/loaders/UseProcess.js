import Swal from "sweetalert2";
import { useGlobalLoader } from "../loaders/ProcessContext";

let isProcessing = false;

export const useProcess = () => {
    const { startLoading, stopLoading } = useGlobalLoader();

    const execute = async (callback, options = {}) => {
        if (isProcessing) return;
        isProcessing = true;

        try {
            startLoading(options.loadingText || "Procesando...");

            await callback();

        } catch (error) {
            if (options.onError) {
                options.onError(error);
            }
        } finally {
            stopLoading();
            isProcessing = false;
        }
    };

    return { execute };
};