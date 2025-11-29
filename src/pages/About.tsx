import { Navbar } from '@/components/Navbar';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-8">
            ABOUT <span className="text-gradient">MYNE WINNER</span>
          </h1>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-3xl font-bold mb-4">Artist Bio</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Myne Winner is a visionary digital artist pushing the boundaries of contemporary art
                through innovative digital mediums. With a unique blend of traditional artistic
                sensibilities and cutting-edge digital techniques, Myne creates immersive visual
                experiences that captivate and inspire.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">Artistic Journey</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                Beginning with traditional art forms, Myne Winner transitioned into the digital realm,
                exploring NFTs, 3D art, and interactive installations. Each piece tells a story,
                inviting viewers into worlds where imagination meets technology.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">Philosophy</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Art is not just about what you see—it's about what you feel. Through bold colors,
                dynamic compositions, and innovative techniques, Myne Winner creates works that
                resonate on an emotional level, bridging the gap between the digital and the human.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">Connect</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Follow the journey and stay updated with new collections, exhibitions, and exclusive
                releases. Join the community of art enthusiasts and collectors who appreciate the
                fusion of art and technology.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
