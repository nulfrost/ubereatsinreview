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
  const data = useActionData<typeof action>();
  const formAction = useFormAction();
  const navigation = useNavigation();
  const { getInputProps, getRootProps, acceptedFiles } = useDropzone({
    maxSize: 5_000_000,
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
              "flex flex-col items-center p-[20px] border border-dashed border-gray-300 rounded-md",
          })}
        >
          <input
            {...getInputProps({
              name: "uber",
              id: "uber",
              "aria-describedby": "file-desc",
            })}
          />
          <span className="text-sm text-gray-500" id="file-desc">
            Drag and drop the .csv file here or click to select file
          </span>
        </div>
        <button
          type="submit"
          disabled={!hasSelectedFile || isSubmitting}
          className="bg-green-500 text-white font-bold w-full py-3 rounded-md hover:bg-green-400 duration-150 disabled:bg-green-300 disabled:cursor-not-allowed"
        >
          See how bad it really is &rarr;
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
