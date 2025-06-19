import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
  {
    name: 'Maria Silva',
    role: 'CEO, TechStart',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    content: 'O Gestfin revolucionou a forma como gerenciamos as finanças da nossa startup. A interface é intuitiva e os relatórios são extremamente detalhados.',
    rating: 5
  },
  {
    name: 'João Santos',
    role: 'Contador Autônomo',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    content: 'Como contador, preciso de precisão nos dados. O Gestfin oferece exatamente isso, com uma organização impecável das informações financeiras.',
    rating: 5
  },
  {
    name: 'Ana Costa',
    role: 'Empresária',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    content: 'Finalmente consegui separar as finanças pessoais das empresariais de forma clara. O sistema de metas me ajudou a alcançar objetivos importantes.',
    rating: 5
  },
  {
    name: 'Carlos Oliveira',
    role: 'Diretor Financeiro',
    avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    content: 'A funcionalidade de contas a pagar salvou nossa empresa de vários atrasos. Os lembretes automáticos são perfeitos.',
    rating: 5
  },
  {
    name: 'Fernanda Lima',
    role: 'Consultora Financeira',
    avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    content: 'Recomendo o Gestfin para todos os meus clientes. É a ferramenta mais completa que já usei para gestão financeira.',
    rating: 5
  },
  {
    name: 'Roberto Mendes',
    role: 'Empreendedor',
    avatar: 'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    content: 'O dashboard do Gestfin me dá uma visão completa do negócio em segundos. Tomei decisões mais assertivas desde que comecei a usar.',
    rating: 5
  }
];

export function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            <Star className="w-4 h-4 mr-2" />
            Depoimentos
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
            O que nossos clientes
            <span className="text-blue-600"> estão dizendo</span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Mais de 10.000 empresas e famílias já confiam no Gestfin para 
            gerenciar suas finanças com segurança e eficiência.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <div className="relative">
                    <Quote className="absolute -top-2 -left-2 w-8 h-8 text-blue-100" />
                    <p className="text-gray-700 leading-relaxed relative z-10">
                      "{testimonial.content}"
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}