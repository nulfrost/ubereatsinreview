import {
  ActionFunctionArgs,
  MetaFunction,
  json,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useFormAction,
  useNavigation,
} from "@remix-run/react";
import { useCallback, useEffect, useRef, useState } from "react";
import Confetti from "react-confetti";
import { useDropzone } from "react-dropzone-esm";
import { useWindowSize } from "react-use";
import { ClientOnly } from "remix-utils/client-only";
import {
  convertCsvToJson,
  isUploadedFile,
  removeTempFile,
  uploadHandler,
} from "./parse.server";
import { getFirstOrder, getTotalSpend } from "./sum";
import toast, { Toaster } from "react-hot-toast";

export const meta: MetaFunction = () => {
  return [
    { title: "How Much Have I Spent On Uber Eats" },
    {
      name: "description",
      content:
        "Find out how much money you've given to the behemoth named Uber",
    },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );
  const file = formData.get("uber");
  if (!isUploadedFile(file)) return null;
  const convertedJsonData = await convertCsvToJson(file.filepath);
  const orderTotal = getTotalSpend(convertedJsonData);
  const firstOrder = getFirstOrder(convertedJsonData);
  await removeTempFile(file.filepath);
  return json({ orderTotal, firstOrder });
}

export default function Index() {
  const input = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [fileName, setFileName] = useState("");

  const data = useActionData<typeof action>();
  const formAction = useFormAction();
  const navigation = useNavigation();
  const { width, height } = useWindowSize();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (typeof input.current !== null) {
        const dT = new DataTransfer();
        for (const file of acceptedFiles) {
          dT.items.add(file);
        }

        const file = acceptedFiles.at(0);

        setFileName(file!.name);

        input.current!.files = dT.files;
      }
    },
    [input.current]
  );

  const { getInputProps, getRootProps, acceptedFiles, isDragActive } =
    useDropzone({
      onDrop,
      maxSize: 100_000,
      accept: {
        "text/csv": [".csv"],
      },
    });

  const hasSelectedFile = acceptedFiles.length > 0;

  const isSubmitting =
    navigation.state === "submitting" &&
    navigation.formAction === formAction &&
    navigation.formMethod === "POST";

  function showErrorToast() {
    toast(
      "Oops! Seems like there was an error, try re-downloading your Uber Eats data and try again.",
      { duration: 5000 }
    );
  }

  useEffect(() => {
    if (data?.orderTotal === 0) {
      showErrorToast();
    }
  }, [data?.orderTotal]);

  const parsedOrderTimeDate = new Date(Date.parse(data?.firstOrder!));
  return (
    <>
      <div className="absolute right-10 top-4">
        <dialog
          ref={dialogRef}
          className="rounded-md pt-10 px-10 pb-5 border border-gray-200 shadow-lg relative max-w-[60ch]"
        >
          <h2 className="text-xl font-bold mb-2">How to get your Uber data</h2>
          <ol className="list-decimal list-inside mb-4">
            <li>Open the Uber app</li>
            <li>Go to Account &gt; Settings &gt; Privacy &gt; See summary</li>
            <li>
              Scroll down to the Uber Eats section and tap on 'View my orders'
            </li>
            <li>Tap on 'Uber&apos;s data download feature'</li>
            <li>Scroll down and tap on Download Data</li>
            <li>
              Once you have your data, un-zip the contents and upload the
              'eats_order_details.csv' inside of the 'Eats' folder
            </li>
          </ol>
          <p className="text-sm text-gray-500">
            note: the data is not available right away, it will take about 24 -
            48h for Uber to e-mail you your data
          </p>
          <button
            aria-label="Close help dialog"
            autoFocus
            onClick={() => dialogRef?.current?.close()}
            className="focus-visible:outline focus-visible:outline-indigo-500 focus-visible:outline-2 absolute top-4 right-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </dialog>
        <button
          onClick={() => dialogRef?.current?.showModal()}
          className="text-indigo-600 font-semibold hover:bg-indigo-50 px-4 py-1.5 rounded-md duration-150 flex items-center gap-2 border-none focus-visible:outline-2 focus-visible:outline-indigo-300 focus-visible:bg-indigo-50"
        >
          <span>How to use</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
        </button>
      </div>
      <div className="h-full flex justify-center flex-col items-center px-2">
        <Toaster toastOptions={{ className: "bg-red-100" }} />
        <ClientOnly>
          {() => (
            <Confetti
              width={width}
              height={height}
              recycle={false}
              numberOfPieces={3000}
              run={data?.orderTotal ? true : false}
            />
          )}
        </ClientOnly>
        <h1 className="font-bold text-3xl max-w-[20ch] text-center">
          How much have you spent on Uber Eats so far
        </h1>
        <Form
          method="post"
          encType="multipart/form-data"
          className="space-y-4 mb-4"
        >
          <label htmlFor="uber" className="block sr-only">
            Import your Uber Eats data
          </label>
          <div
            {...getRootProps({
              className: `flex flex-col items-center p-[20px] border-2 border-dashed border-gray-300 rounded-md py-20 bg-gray-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-green-600  duration-150 cursor-pointer focus-visible:outline-offset-4 hover:bg-blue-50 ${
                isDragActive ? "bg-blue-50 motion-safe:animate-pulse" : null
              }`,
            })}
          >
            <input
              {...getInputProps()}
              id="uber"
              name="uber"
              required
              aria-required
              type="file"
              ref={input}
            />
            <span className="text-sm text-gray-600" id="file-desc">
              Drag and drop the .csv file here or click here to select the file
            </span>
          </div>
          {fileName ? (
            <p className="bg-blue-50 text-center py-4 rounded-md border-2 border-blue-200 text-sm text-blue-900 font-bold">
              {fileName}
            </p>
          ) : null}
          <button
            disabled={!hasSelectedFile || isSubmitting}
            className="bg-green-500 text-white font-bold w-full py-3 rounded-md hover:bg-green-400 duration-150 disabled:bg-green-300 disabled:cursor-not-allowed"
          >
            Find out how bad it really is &rarr;
          </button>
        </Form>
        {data?.orderTotal ? (
          <p className="text-xl">
            You've spent{" "}
            <span className="text-2xl font-bold text-indigo-500">
              {new Intl.NumberFormat("en-CA", {
                style: "currency",
                currencyDisplay: "code",
                currency: "CAD",
              }).format(data?.orderTotal)}
            </span>{" "}
            on Uber Eats since since{" "}
            <time
              dateTime={parsedOrderTimeDate.toISOString()}
              className="font-bold text-xl text-indigo-500"
            >
              {" "}
              {new Intl.DateTimeFormat("en-CA", {
                dateStyle: "full",
                timeStyle: "medium",
              }).format(parsedOrderTimeDate)}
            </time>
          </p>
        ) : null}
      </div>
    </>
  );
}
