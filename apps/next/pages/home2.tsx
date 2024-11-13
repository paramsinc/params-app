import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Brain, Calendar, ChevronRight, User, Github, Linkedin } from 'lucide-react'
import { GradientBackground } from '@/components/gradient-background'
import Image from 'next/image'
import { TwitterIcon } from '@/components/icons/twitter'
import { Logo } from '@/components/logo'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20 relative overflow-hidden">
      <div className="container mx-auto px-4 py-16 md:py-24 relative">
        <GradientBackground />
        <div className="mb-16">
          <Logo />
        </div>
        <div className="mb-16 md:mb-24 relative">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Find curated ML templates
            <br />& book a call with the creators
          </h1>
        </div>

        <div className="space-y-8">
          {/* François's Template Card */}
          <Card className="md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:p-0 p-4">
              <div className="lg:col-span-2 order-1 lg:order-2">
                <Card className="h-full flex flex-col bg-background z-10">
                  <CardHeader>
                    <CardTitle>@francois/recommendation-system</CardTitle>
                    <CardDescription>
                      A scalable recommendation engine built with TensorFlow, featuring
                      collaborative filtering, content-based filtering, and hybrid approaches.
                      Includes pre-trained models and example datasets.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-muted-foreground">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                        Production-ready
                      </div>
                      <div className="mx-2">•</div>
                      <div>Updated 2 days ago</div>
                    </div>
                  </CardContent>
                  <CardFooter className="mt-auto pt-6">
                    <Button variant="secondary" size="sm" className="ml-auto">
                      View Repo
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <div className="lg:col-span-1 order-2 lg:order-1 z-10">
                <div className="flex flex-col h-full">
                  <div className="flex flex-col lg:flex-row lg:align-center lg:self-start gap-4 flex-1">
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <Image
                        src="https://upload.wikimedia.org/wikipedia/commons/7/71/Fchollet.jpg"
                        alt="François Chollet"
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold">François Chollet</h2>
                      <p className="text-muted-foreground">AI Researcher at Google</p>
                    </div>
                  </div>

                  <div className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full">
                        <User className="mr-2 h-4 w-4" />
                        View Profile
                      </Button>
                      <Button className="w-full">
                        <Calendar className="mr-2 h-4 w-4" />
                        Book a Call
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Jeremy's Template Card */}
          <Card className="md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:p-0 p-4">
              <div className="lg:col-span-2 order-1 lg:order-2">
                <Card className="h-full flex flex-col bg-background z-10">
                  <CardHeader>
                    <CardTitle>@jeremy/rag</CardTitle>
                    <CardDescription>
                      Production-grade Retrieval Augmented Generation (RAG) system with advanced
                      vector search, dynamic context window management, and streaming responses.
                      Features automatic document chunking, hybrid search capabilities, and seamless
                      integration with popular LLM providers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-muted-foreground">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                        Production-ready
                      </div>
                      <div className="mx-2">•</div>
                      <div>Updated today</div>
                    </div>
                  </CardContent>
                  <CardFooter className="mt-auto pt-6">
                    <Button variant="secondary" size="sm" className="ml-auto">
                      View Repo
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <div className="lg:col-span-1 order-2 lg:order-1 z-10">
                <div className="flex flex-col h-full">
                  <div className="flex flex-col lg:flex-row lg:align-center lg:self-start gap-4 flex-1">
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <Image
                        src="https://media.licdn.com/dms/image/v2/D4E03AQHT6iIwSc7LVQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1727276090994?e=1736985600&v=beta&t=_E1emkCsF6pEKAIlFeSmCW2dOf_aI8UW5kON1Y6dPIM"
                        alt="Jeremy Berman"
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold">Jeremy Berman</h2>
                      <p className="text-muted-foreground">AI at Params</p>
                    </div>
                  </div>

                  <div className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full">
                        <User className="mr-2 h-4 w-4" />
                        View Profile
                      </Button>
                      <Button className="w-full">
                        <Calendar className="mr-2 h-4 w-4" />
                        Book a Call
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
