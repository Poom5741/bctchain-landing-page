"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Zap, Shield } from "lucide-react"
import Link from "next/link"

interface ErrorDisplayProps {
  code: string
  message?: string
}

export function ErrorDisplay({ code, message }: ErrorDisplayProps) {
  const [isRetrying, setIsRetrying] = useState(false)

  const getErrorDetails = () => {
    switch (code) {
      case "400":
        return {
          title: "Bad Request",
          description: "The request could not be understood by the server due to malformed syntax.",
          icon: AlertTriangle,
          color: "orange",
          suggestions: [
            "Check the URL for any typos",
            "Ensure all required parameters are provided",
            "Verify the request format is correct",
          ],
        }
      case "500":
        return {
          title: "Internal Server Error",
          description: "The server encountered an unexpected condition that prevented it from fulfilling the request.",
          icon: Zap,
          color: "red",
          suggestions: [
            "Try refreshing the page",
            "Wait a few minutes and try again",
            "Contact support if the problem persists",
          ],
        }
      default:
        return {
          title: "Something Went Wrong",
          description: "An unexpected error occurred while processing your request.",
          icon: AlertTriangle,
          color: "yellow",
          suggestions: ["Try refreshing the page", "Check your internet connection", "Contact support if needed"],
        }
    }
  }

  const errorDetails = getErrorDetails()
  const ErrorIcon = errorDetails.icon

  const handleRetry = () => {
    setIsRetrying(true)
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative text-center mb-12 animate-in fade-in-0 slide-in-from-bottom-8 duration-1000">
          {/* Error Code */}
          <div className="mb-8">
            <div className="text-8xl lg:text-9xl font-bold text-transparent bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text animate-pulse">
              {code}
            </div>
          </div>

          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div
              className={`w-24 h-24 rounded-full bg-${errorDetails.color}-500/20 border border-${errorDetails.color}-500/30 flex items-center justify-center animate-bounce`}
            >
              <ErrorIcon className={`w-12 h-12 text-${errorDetails.color}-400`} />
            </div>
          </div>

          {/* Error Title */}
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">{errorDetails.title}</h1>

          {/* Error Description */}
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            {message || errorDetails.description}
          </p>
        </div>

        {/* Error Details Card */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl mb-8 animate-in fade-in-0 slide-in-from-bottom-6 duration-1000 delay-200">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* What happened */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-orange-400" />
                  What happened?
                </h3>
                <p className="text-gray-400 leading-relaxed mb-4">
                  {code === "400" &&
                    "Your browser sent a request that this server could not understand. This usually happens when there's an issue with the request format or missing required information."}
                  {code === "500" &&
                    "Our server encountered an internal error and was unable to complete your request. This is typically a temporary issue on our end."}
                  {code !== "400" &&
                    code !== "500" &&
                    "An unexpected error occurred while processing your request. This could be due to various factors including network issues or server problems."}
                </p>
              </div>

              {/* What you can do */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-400" />
                  What you can do
                </h3>
                <ul className="space-y-2">
                  {errorDetails.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-gray-400 flex items-start">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-400">
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 mr-2" />
                Try Again
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 px-8 py-3 text-lg"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </Button>

          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-3 text-lg" asChild>
            <Link href="/">
              <Home className="w-5 h-5 mr-2" />
              Home
            </Link>
          </Button>
        </div>

        {/* Additional Help */}
        <div className="mt-16 text-center animate-in fade-in-0 slide-in-from-bottom-2 duration-1000 delay-600">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold text-white mb-4">Still need help?</h3>
              <p className="text-gray-400 mb-6">
                If you continue to experience issues, our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10" asChild>
                  <Link href="/docs">View Documentation</Link>
                </Button>
                <Button variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Code Details */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Error Code: {code} • Timestamp: {new Date().toLocaleString()} • Request ID:{" "}
            {Math.random().toString(36).substr(2, 9)}
          </p>
        </div>
      </div>
    </div>
  )
}
