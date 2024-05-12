import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import img from "../../src/img/logo-ip.png";
import Barcode from "react-barcode";
// import Barcode from "react-barcode";

const InvoiceModal = ({
  isOpen,
  setIsOpen,
  invoiceInfo,
  items,
  onAddNextInvoice,
}) => {
  function closeModal() {
    setIsOpen(false);
  }

  const addNextInvoiceHandler = () => {
    setIsOpen(false);
    onAddNextInvoice();
  };

  const SaveAsPDFHandler = () => {
    const dom = document.getElementById("print");
    toPng(dom)
      .then((dataUrl) => {
        const img = new Image();
        img.crossOrigin = "annoymous";
        img.src = dataUrl;
        img.onload = () => {
          // Initialize the PDF.
          const pdf = new jsPDF({
            orientation: "landscape",
            unit: "in",
          });

          // Define reused data
          const imgProps = pdf.getImageProperties(img);
          const imageType = imgProps.fileType;
          const pdfWidth = pdf.internal.pageSize.getWidth();

          // Calculate the number of pages.
          const pxFullHeight = imgProps.height;
          const pxPageHeight = Math.floor((imgProps.width * 8.5) / 5.5);
          const nPages = Math.ceil(pxFullHeight / pxPageHeight);

          // Define pageHeight separately so it can be trimmed on the final page.
          let pageHeight = pdf.internal.pageSize.getHeight();

          // Create a one-page canvas to split up the full image.
          const pageCanvas = document.createElement("canvas");
          const pageCtx = pageCanvas.getContext("2d");
          pageCanvas.width = imgProps.width;
          pageCanvas.height = pxPageHeight;

          for (let page = 0; page < nPages; page++) {
            // Trim the final page to reduce file size.
            if (page === nPages - 1 && pxFullHeight % pxPageHeight !== 0) {
              pageCanvas.height = pxFullHeight % pxPageHeight;
              pageHeight = (pageCanvas.height * pdfWidth) / pageCanvas.width;
            }
            // Display the page.
            const w = pageCanvas.width;
            const h = pageCanvas.height;
            pageCtx.fillStyle = "white";
            pageCtx.fillRect(0, 0, w, h);
            pageCtx.drawImage(img, 0, page * pxPageHeight, w, h, 0, 0, w, h);

            // Add the page to the PDF.
            if (page) pdf.addPage();

            const imgData = pageCanvas.toDataURL(`image/${imageType}`, 1);
            pdf.addImage(imgData, imageType, 0, 0, pdfWidth, pageHeight);
          }
          // Output / Save
          pdf.save(`invoice-${invoiceInfo.invoiceNumber}.pdf`);
        };
      })
      .catch((error) => {
        console.error("oops, something went wrong!", error);
      });
  };

  const date = new Date();
  const today = date.toLocaleDateString("en-GB", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  });
    let serialNumberCounter = invoiceInfo.invoiceNumber;

    function generateSerialNumber() {
      const paddedCounter = serialNumberCounter.toString().padStart(7, "0");
      return paddedCounter;
    }


  const Invoice = ({ copy }) => {
    return (
      <div>
        <div className="mx-5 grid grid-cols-3">
          <div className="col-span-1">
            <div className="">
              <p>Bill From</p>
              <img className="w-32" src={img} alt="" />
            </div>

            <h2 className=" text-2xl font-bold">{invoiceInfo.cashierName}</h2>
            <h2 className="text-xl font-bold">COD</h2>
            <p className="text-xs">Shop no 9/B (2nd Floor)</p>
            <p className="text-xs">BTI Premier Plaza Shopping mall</p>
            <p className="text-xs">North Badda, Dhaka 1212</p>
            <p className="text-xs">
              <span className="font-bold">Phone No. </span> +8809611-595290
            </p>
          </div>
          <div>
            <p className="col-span-1 text-center text-xs">{copy} Copy</p>
          </div>
          <div className="col-span-1 text-right">
            <h1 className="text-3xl font-bold">INVOICE</h1>
            <p>#IP{generateSerialNumber()}COD</p>

            <p className="text-xs">Date: {today}</p>
            <div className="flex justify-end">
              <Barcode
                 width= {2}
                 height= {50}
                value={`#IP${invoiceInfo.invoiceNumber}COD`}
                displayValue={false}
              />
            </div>

            <p className="text-xs font-bold">
              Bill To:{" "}
              <span className="font-normal">{invoiceInfo.customerName}</span>
            </p>
            <p className="text-xs font-bold">
              Mobile no.{" "}
              <span className="font-normal">{invoiceInfo.customerPhone}</span>
            </p>
            <p className="text-xs font-bold">Address:</p>
            <p className="text-xs">{invoiceInfo.customerAddress}</p>
          </div>
        </div>
        <div className="mx-5 mt-10">
          <table className="w-full text-left">
            <thead>
              <tr className="border-y border-black/10 text-sm md:text-base">
                <th className="text-center">Item & Description</th>
                <th className="text-center">Rate</th>
                <th className="text-right">Quantity</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="w-[50%]">{item.name}</td>
                  <td className="min-w-[50px] text-center">Tk. {item.price}</td>
                  <td className="min-w-[80px] text-center">
                    {Number(item.qty).toFixed(0)}
                  </td>
                  <td className="min-w-[90px] text-right">
                    Tk. {Number(item.price * item.qty).toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6">
          <div className="mt-10 mr-5 ml-auto flex max-w-xs flex-col items-end space-y-2">
            <div className="flex w-full justify-between pt-10">
              <span className="font-bold">Subtotal:</span>
              <span>Tk. {invoiceInfo.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex w-full justify-between">
              <span className="font-bold">Delivery Charge:</span>
              <span>
                Tk.{" "}
                {isNaN(invoiceInfo.deliCharge)
                  ? "0.00"
                  : invoiceInfo.deliCharge.toFixed(2)}
              </span>
            </div>
            <div className="flex w-full justify-between">
              <span className="font-bold">Total:</span>
              <span>
                {isNaN(invoiceInfo.total)
                  ? "0.00"
                  : invoiceInfo.total.toFixed(2)}{" "}
                BDT
              </span>
            </div>
            <div className="flex w-full justify-between">
              <span className="font-bold">Paid Amount:</span>
              <span>
                {isNaN(invoiceInfo.paidAmount)
                  ? "0.00"
                  : invoiceInfo.paidAmount.toFixed(2)}{" "}
                BDT
              </span>
            </div>
            <div className="flex w-full justify-between border-t border-black/10 py-2">
              <span className="font-bold">Due:</span>
              <span className="font-bold">
                {isNaN(invoiceInfo.due)
                  ? "0.00"
                  : invoiceInfo.due % 1 === 0
                  ? invoiceInfo.due
                  : invoiceInfo.due.toFixed(2)}{" "}
                BDT
              </span>
            </div>
          </div>
        </div>
        <div className="mt-16 text-center text-xs font-semibold text-violet-900">
          <h1>**{invoiceInfo.note}**</h1>
        </div>
      </div>
    );
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={closeModal}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="my-8 inline-block w-full max-w-7xl transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all">
              <div className="flex py-10 px-5" id="print">
                <Invoice copy={"Customer"} />
                <Invoice copy={"Office"} />
              </div>
              <div className="mt-4 flex space-x-2 px-4 pb-6">
                <button
                  className="flex w-full items-center justify-center space-x-1 rounded-md border border-blue-500 py-2 text-sm text-blue-500 shadow-sm hover:bg-blue-500 hover:text-white"
                  onClick={SaveAsPDFHandler}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  <span>Download</span>
                </button>
                <button
                  onClick={addNextInvoiceHandler}
                  className="flex w-full items-center justify-center space-x-1 rounded-md bg-blue-500 py-2 text-sm text-white shadow-sm hover:bg-blue-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  </svg>
                  <span>Next</span>
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default InvoiceModal;
