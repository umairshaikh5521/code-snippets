//logic to set 10 digits after country code

"use client";

import React, { useState } from "react";

type Props = {};

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  formStepState,
  FormStepState,
  userState,
  merchantState,
} from "@/atoms/stepsAtom";
import { useRecoilState } from "recoil";
import "react-phone-number-input/style.css";
import PhoneInput, {
  isValidPhoneNumber,
  parsePhoneNumber,
} from "react-phone-number-input";
import axios from "axios";
const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

const urlWithoutProtocolRegex =
  /^((https?:\/\/)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(\/\S*)?$/;
const formSchema = z.object({
  phoneNumber: z.string().refine(
    (value) => {
      try {
        const phoneNumber = parsePhoneNumber(value);
        if (!phoneNumber) return false;
        const nationalNumber = phoneNumber.nationalNumber;
        return nationalNumber.length === 10;
      } catch (error) {
        return false;
      }
    },
    { message: "Please enter a valid phone number" }
  ),
  email: z
    .string()
    .regex(/^[^|]+$|^$/, {
      message: 'Invalid character "|"',
    })
    .email(),
  companyWebsite: z
    .string()
    .regex(/^[^|]+$|^$/, {
      message: 'Invalid character "|"',
    })
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => val === "" || urlWithoutProtocolRegex.test(val as string),
      {
        message: "Please enter a valid email",
      }
    ),
});

const ContactInfoForm = (props: Props) => {
  const [formStep, setFormStep] = useRecoilState<FormStepState>(formStepState);
  const [user, setUser] = useRecoilState(userState);

  const [merchantData, setMerchantData] = useRecoilState(merchantState);
  const { currentStep, completedSteps } = formStep;

  // map the default values to the form

  const mappedDefaultValues: any = {
    phoneNumber: merchantData.contactInfo.phoneNumber,
    email: merchantData.contactInfo.email,
    companyWebsite: merchantData.contactInfo.companyWebsite,
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: mappedDefaultValues,
  });
  interface ContactInfo {
    phoneNumber: string;
    email: string;
    companyWebsite?: string;
  }
  function mapToContactInfo(data: any): ContactInfo {
    return {
      phoneNumber: data.phoneNumber || "",
      email: data.email || "",
      companyWebsite: data.companyWebsite || "",
    };
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const mappedContactInfo: ContactInfo = mapToContactInfo(values);

    const path = `${process.env.NEXT_PUBLIC_API_URL}/merchant-acquiring-form/contact-info`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.token}`,
    };
    const body = {
      ...mappedContactInfo,
    };
    const res: any = await axios.post(path, body, { headers: headers });

    if (res.status == 200) {
      setFormStep({
        currentStep: currentStep + 1,
        completedSteps: [...completedSteps, currentStep],
      });
    } else {
    }
  }
  return (
    <div>
      <div className="text-3xl">Contact Info</div>
      {/* <div className="text-md mt-[15px]">
        We just need your company’s legal address
      </div> */}
      <div className="mt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Phone Number</FormLabel>
                  {/* <FormControl>
                    <Controller
                      name="phoneNumber"
                      control={form.control}
                      rules={{
                        required: false,
                        validate: (value) => isValidPhoneNumber(value),
                      }}
                      render={({ field: { onChange, value } }) => (
                        <PhoneInput
                          value={value}
                          onChange={onChange}
                          defaultCountry="TH"
                          id="phone-input"
                        />
                      )}
                    />
                  </FormControl> */}
                  <FormControl>
                    <Controller
                      name="phoneNumber"
                      control={form.control}
                      rules={{
                        validate: (value) => {
                          const digitsOnly = value?.replace(/\D/g, "");
                          return (
                            digitsOnly.length <= 10 ||
                            "Please enter a valid phone number"
                          );
                        },
                      }}
                      render={({
                        field: { onChange, value },
                        fieldState: { error },
                      }) => (
                        <>
                          <PhoneInput
                            value={value}
                            onChange={onChange}
                            defaultCountry="US"
                            id="phone-input"
                          />
                          {error && (
                            <p className="text-sm font-medium text-destructive">
                              {error.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  </FormControl>
                  {/* {form.formState.errors["phoneNumber"] && (
                    <p className="text-sm font-medium text-destructive">
                      Invalid Phone Number
                    </p>
                  )} */}
                  {/* <FormMessage /> */}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email </FormLabel>
                  <FormControl>
                    <Input placeholder="" type="email" {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyWebsite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company website (optional) </FormLabel>
                  <FormControl>
                    <Input placeholder="" {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 mt-6 ">
              <Button
                onClick={() =>
                  setFormStep({
                    currentStep: currentStep - 1,
                    completedSteps: [...completedSteps],
                  })
                }
                variant={"back"}
              >
                Back
              </Button>
              <Button variant={"submit"} type="submit">
                Next
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ContactInfoForm;
