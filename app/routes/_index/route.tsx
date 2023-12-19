import {
  ActionFunctionArgs,
  MetaFunction,
  unstable_parseMultipartFormData,
  json,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useFormAction,
  useNavigation,
} from "@remix-run/react";
import {
  convertCsvToJson,
  isUploadedFile,
  uploadHandler,
  removeTempFile,
} from "./parse.server";
import { getFirstOrder, getTotalSpend } from "./sum";
import { useDropzone } from "react-dropzone-esm";
import { useCallback, useRef } from "react";
import { useWindowSize } from "react-use";
import Confetti from "react-confetti";
import { ClientOnly } from "remix-utils/client-only";

export const meta: MetaFunction = () => {
  return [
    { title: "How Much Have I Spent On Uber" },
    { name: "description", content: "look at your sins in the face" },
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

        input.current!.files = dT.files;
      }
    },
    [input.current]
  );

  const { getInputProps, getRootProps, acceptedFiles } = useDropzone({
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

  const parsedOrderTimeDate = new Date(Date.parse(data?.firstOrder!));
  return (
    <div className="h-full flex justify-center flex-col items-center">
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
        See how much you've spent on Uber Eats so far
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
            className:
              "flex flex-col items-center p-[20px] border border-dashed border-gray-300 rounded-md py-20",
          })}
        >
          <input
            {...getInputProps()}
            id="uber"
            name="uber"
            type="file"
            ref={input}
          />
          <span className="text-sm text-gray-500" id="file-desc">
            Drag and drop the .csv file here or click here to select the file
          </span>
        </div>
        {/* <input type="file" name="uber" id="uber" /> */}
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
          <span className="text-2xl font-bold">
            {new Intl.NumberFormat("en-CA", {
              style: "currency",
              currencyDisplay: "code",
              currency: "CAD",
            }).format(data?.orderTotal)}
          </span>{" "}
          on Uber Eats since since{" "}
          <time
            dateTime={parsedOrderTimeDate.toISOString()}
            className="font-bold text-xl"
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
  );
}
